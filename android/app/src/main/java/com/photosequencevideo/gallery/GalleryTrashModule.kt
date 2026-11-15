package com.photosequencevideo.gallery

import android.app.Activity
import android.content.ContentValues
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.MediaStore
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

/**
 * Moves a MediaStore item to the system trash instead of deleting it, so the
 * user can restore it from their gallery for ~30 days.
 *
 * Resolves with one of:
 *  - "trashed":   moved to the trash (Android 11+)
 *  - "deleted":   removed outright (Android 10 and below have no trash)
 *  - "missing":   the item no longer exists (e.g. the user deleted it)
 *  - "cancelled": the user declined the system consent dialog
 */
class GalleryTrashModule(
  private val reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext),
  ActivityEventListener {
  private var pendingConsent: Promise? = null

  init {
    reactContext.addActivityEventListener(this)
  }

  override fun getName() = NAME

  @ReactMethod
  fun trash(
    uriString: String,
    promise: Promise,
  ) {
    val uri = Uri.parse(uriString)
    val resolver = reactContext.contentResolver

    try {
      if (!exists(uri)) {
        promise.resolve(RESULT_MISSING)
        return
      }

      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) {
        val removed = resolver.delete(uri, null, null)
        promise.resolve(if (removed > 0) RESULT_DELETED else RESULT_MISSING)
        return
      }

      // The app owns items it inserted, and owners may trash without consent.
      try {
        val values = ContentValues().apply { put(MediaStore.MediaColumns.IS_TRASHED, 1) }
        if (resolver.update(uri, values, null, null) > 0) {
          promise.resolve(RESULT_TRASHED)
          return
        }
      } catch (_: SecurityException) {
        // Not the owner any more (e.g. after a reinstall): ask the user below.
      }

      requestTrashConsent(uri, promise)
    } catch (e: Exception) {
      promise.reject("E_TRASH_FAILED", e.message, e)
    }
  }

  /**
   * Reports where a gallery item is, so the app can follow restores and
   * permanent deletions made in the gallery app. Resolves with:
   *  - "active":  in the gallery (e.g. restored from the trash)
   *  - "trashed": in the system trash (Android 11+)
   *  - "missing": gone for good
   *  - "unknown": can't tell (e.g. no read access after a reinstall)
   */
  @ReactMethod
  fun status(
    uriString: String,
    promise: Promise,
  ) {
    val uri = Uri.parse(uriString)
    try {
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) {
        promise.resolve(if (exists(uri)) STATUS_ACTIVE else RESULT_MISSING)
        return
      }
      // Trashed items are hidden from queries unless explicitly included.
      val args = Bundle().apply { putInt(MediaStore.QUERY_ARG_MATCH_TRASHED, MediaStore.MATCH_INCLUDE) }
      val status =
        reactContext.contentResolver
          .query(uri, arrayOf(MediaStore.MediaColumns.IS_TRASHED), args, null)
          ?.use { cursor ->
            when {
              !cursor.moveToFirst() -> RESULT_MISSING
              cursor.getInt(0) == 1 -> RESULT_TRASHED
              else -> STATUS_ACTIVE
            }
          } ?: RESULT_MISSING
      promise.resolve(status)
    } catch (_: SecurityException) {
      promise.resolve(STATUS_UNKNOWN)
    } catch (e: Exception) {
      promise.reject("E_STATUS_FAILED", e.message, e)
    }
  }

  private fun requestTrashConsent(
    uri: Uri,
    promise: Promise,
  ) {
    val activity = reactContext.getCurrentActivity()
    if (activity == null || Build.VERSION.SDK_INT < Build.VERSION_CODES.R) {
      promise.reject("E_NO_ACTIVITY", "No activity to show the trash request")
      return
    }
    if (pendingConsent != null) {
      promise.reject("E_BUSY", "A trash request is already in progress")
      return
    }
    val request = MediaStore.createTrashRequest(reactContext.contentResolver, listOf(uri), true)
    pendingConsent = promise
    activity.startIntentSenderForResult(request.intentSender, REQUEST_CODE, null, 0, 0, 0)
  }

  private fun exists(uri: Uri): Boolean =
    reactContext.contentResolver
      .query(uri, arrayOf(MediaStore.MediaColumns._ID), null, null, null)
      ?.use { it.count > 0 } ?: false

  override fun onActivityResult(
    activity: Activity,
    requestCode: Int,
    resultCode: Int,
    data: Intent?,
  ) {
    if (requestCode != REQUEST_CODE) return
    val promise = pendingConsent ?: return
    pendingConsent = null
    promise.resolve(if (resultCode == Activity.RESULT_OK) RESULT_TRASHED else RESULT_CANCELLED)
  }

  override fun onNewIntent(intent: Intent) = Unit

  companion object {
    const val NAME = "GalleryTrash"
    private const val REQUEST_CODE = 0x7A5
    private const val RESULT_TRASHED = "trashed"
    private const val RESULT_DELETED = "deleted"
    private const val RESULT_MISSING = "missing"
    private const val RESULT_CANCELLED = "cancelled"
    private const val STATUS_ACTIVE = "active"
    private const val STATUS_UNKNOWN = "unknown"
  }
}

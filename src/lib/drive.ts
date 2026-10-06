/**
 * Google Drive ID Card Image Uploader via Google Apps Script Webhook.
 * 
 * Takes attendee ID card base64 image data and uploads it directly to the organizer's
 * Google Drive folder without needing Google Cloud Console service accounts or OAuth.
 */

export async function uploadToGoogleDrive(params: {
  fileName: string;
  base64: string;
  mimeType?: string;
}): Promise<string | null> {
  const webhookUrl = process.env.GOOGLE_DRIVE_WEBHOOK_URL;
  if (!webhookUrl || !webhookUrl.startsWith("http")) {
    return null;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileName: params.fileName,
        base64: params.base64,
        mimeType: params.mimeType || "image/jpeg",
      }),
      redirect: "follow",
    });

    if (!response.ok) {
      console.warn(`[Google Drive] Webhook HTTP error: ${response.status}`);
      return null;
    }

    const result = await response.json();
    if (result && result.success && result.url) {
      console.log(`[Google Drive] Successfully saved image to Google Drive: ${result.url}`);
      return result.url;
    }

    if (result && result.fileId) {
      return `https://lh3.googleusercontent.com/d/${result.fileId}`;
    }

    console.warn("[Google Drive] Webhook response missing URL:", result);
    return null;
  } catch (error: any) {
    console.warn("[Google Drive] Upload failed:", error.message || error);
    return null;
  }
}

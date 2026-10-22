const { getSupabaseClient } = require('../supabase/client')
const { addMediaItem } = require('./adminService')
const crypto = require('crypto')
const path = require('path')

const BUCKET_MAP = {
  profile:     'profile-images',
  project:     'project-screenshots',
  certificate: 'certificates',
  resume:      'resumes',
  general:     'portfolio-media',
}

/**
 * Upload a file buffer to Supabase Storage
 * @param {Buffer} buffer      - File content
 * @param {string} originalName - Original filename
 * @param {string} mimeType    - e.g. 'image/png'
 * @param {string} category    - profile | project | certificate | resume | general
 * @returns {{ url: string, path: string, mediaItem: object }}
 */
async function uploadFile(buffer, originalName, mimeType, category = 'general') {
  const supabase = getSupabaseClient()
  const bucket = BUCKET_MAP[category] || BUCKET_MAP.general

  // Create a unique filename
  const ext = path.extname(originalName) || '.bin'
  const hash = crypto.randomBytes(8).toString('hex')
  const filename = `${Date.now()}-${hash}${ext}`
  const storagePath = `${category}/${filename}`

  // Upload to Supabase Storage
  let uploadError = null
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .upload(storagePath, buffer, {
        contentType: mimeType,
        upsert: false,
      })
    uploadError = error
  } catch (err) {
    uploadError = err
  }

  // Auto-create bucket if not found and retry upload
  if (uploadError && (uploadError.message?.toLowerCase().includes('bucket not found') || uploadError.status === 404)) {
    try {
      console.log(`Storage bucket "${bucket}" not found. Attempting to create it dynamically...`)
      const { error: createError } = await supabase.storage.createBucket(bucket, { public: true })
      if (!createError) {
        console.log(`Successfully created storage bucket "${bucket}". Retrying upload...`)
        const { error: retryError } = await supabase.storage
          .from(bucket)
          .upload(storagePath, buffer, {
            contentType: mimeType,
            upsert: false,
          })
        uploadError = retryError
      } else {
        uploadError = createError
      }
    } catch (err) {
      console.error(`Failed to auto-create bucket "${bucket}":`, err)
    }
  }

  if (uploadError) throw uploadError

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(storagePath)

  const fileType = mimeType.startsWith('image/') ? 'image'
                 : mimeType === 'application/pdf' ? 'pdf'
                 : 'document'

  // Save to media_library table
  const mediaItem = await addMediaItem({
    filename: originalName,
    storage_path: storagePath,
    storage_url: publicUrl,
    file_type: fileType,
    file_size: buffer.length,
    bucket,
  })

  return { url: publicUrl, path: storagePath, mediaItem }
}

/**
 * Delete a file from Supabase Storage by storage path
 */
async function deleteFile(bucket, storagePath) {
  const supabase = getSupabaseClient()
  const { error } = await supabase.storage.from(bucket).remove([storagePath])
  if (error) throw error
  return { deleted: true }
}

module.exports = { uploadFile, deleteFile, BUCKET_MAP }

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const uploadDir = path.join(__dirname, '../../uploads');
const avatarDir = path.join(uploadDir, 'avatars');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}
if (!fs.existsSync(avatarDir)) {
  fs.mkdirSync(avatarDir);
}

exports.uploadImage = async (file) => {
  try {
    const filename = `${uuidv4()}-${file.originalname}`;
    const filepath = path.join(avatarDir, filename);
    await fs.promises.writeFile(filepath, file.buffer);
    return `/uploads/avatars/${filename}`;
  } catch (error) {
    throw new Error('Error uploading file: ' + error.message);
  }
};

exports.deleteImage = async (filepath) => {
  try {
    if (!filepath) return;
    
    const absolutePath = path.join(__dirname, '../..', filepath);
    
    if (fs.existsSync(absolutePath)) {
      await fs.promises.unlink(absolutePath);
    }
  } catch (error) {
    console.error('Error deleting file:', error);
  }
};
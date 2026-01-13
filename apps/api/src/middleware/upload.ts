import multer from "multer";
import sharp from "sharp";
import path from "path";
import fs from "fs";

const tempStorage = multer.memoryStorage();

export const upload = multer({
  storage: tempStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"));
    }
  },
});

export const processImage = async (req: any, res: any, next: any) => {
  if (!req.file) return next();

  const uploadFolder = path.join(__dirname, "../../uploads/payments");

  if (!fs.existsSync(uploadFolder)) {
    fs.mkdirSync(uploadFolder, { recursive: true });
  }

  const filename = `${Date.now()}-${req.file.originalname.replace(/\s+/g, "")}`;
  const savePath = path.join(uploadFolder, filename);

  try {
    await sharp(req.file.buffer)
      .resize({ width: 1200 })
      .jpeg({ quality: 70 })
      .toFile(savePath);

    req.file.path = `/uploads/payments/${filename}`; // path for DB
    req.file.filename = filename;
    next();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error processing image" });
  }
};

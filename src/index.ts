import { exec } from "node:child_process";
import fs from 'fs';
import path from 'path';
import express from 'express';
import multer from 'multer'
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid'
import _ from 'lodash'

const app = express();
const PORT = 3000;

const upload = multer()
app.use(cors())
app.use('/static', express.static(path.join(__dirname, 'storage')))

interface ResponseDTO {
    requestId: any
    success: boolean
    message: string
    data: any
}

app.get('/', (req, res) => {
    res.send('Hello, TypeScript Express App!');
});

app.post('/convert', upload.single('file'), (req, res) => {

    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.file

    const projectId = uuidv4()

    const newDir: string = `${__dirname}/storage/${projectId}`
    console.log(file.originalname.replace(/ /g, "_"))
    // const filePath = path.join(newDir, file.originalname)
    const filePath = path.join(newDir, file.originalname.replace(/ /g, "_"))

    fs.mkdirSync(newDir)
    fs.writeFile(filePath, file.buffer, (error) => {
        if (error) {
            res.json({ error: error })
        }
    })

    // gm convert -density 200 -quality 50%  -background white kme_RE.pdf[11] magick12-50.jpg
    exec(`gm convert -density 200 -quality 75% ${filePath} +adjoin ${newDir}/${projectId}-%03d.jpg`, (error, stdout, stderr) => {
        if (error) {
            // node couldn't execute the command

            //TODO delete file and folder when error
            // fs.rm(newDir, { recursive: true, force: true }, err => {
            //     if (err) {
            //         throw err;
            //     }
            // })

            res.json({ error: error })
        }

        const files = fs.readdirSync(newDir)

        let allFiles: String[] = []

        for (let i = 0; i < (files.length - 1); i++) {
            const fileIdx = _.padStart(i.toString(), 3, '0')
            allFiles.push(`/static/${projectId}/${projectId}-${fileIdx}.jpg`);
        }

        let pages = files.length - 1

        const resp: ResponseDTO = {
            requestId: projectId,
            success: true,
            message: "upload and convert to image success",
            data: {
                pages: pages,
                files: allFiles,
            }
        }

        res.json(resp)
    });

});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});


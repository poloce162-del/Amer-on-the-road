const cloudinary = require("cloudinary").v2;
const express = require("express");
const path = require("path");
const multer = require("multer");

const app = express();

/* =========================================
   CLOUDINARY
========================================= */

cloudinary.config(process.env.CLOUDINARY_URL);

/* =========================================
   MEMORY DATABASE
========================================= */

let orders = [];

/* =========================================
   MIDDLEWARE
========================================= */

app.use(express.json({
    limit: "50mb"
}));

app.use(express.urlencoded({
    extended: true,
    limit: "50mb"
}));

/* =========================================
   STATIC FILES
========================================= */

app.use(
    express.static(
        path.join(__dirname, "public")
    )
);

app.use(express.static(__dirname));

app.use(
    "/leaflet",
    express.static(
        path.join(
            __dirname,
            "node_modules",
            "leaflet",
            "dist"
        )
    )
);

/* =========================================
   MULTER MEMORY STORAGE
========================================= */

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 20 * 1024 * 1024
    }
});

/* =========================================
   FUNCTIONS
========================================= */

function readOrders() {
    return orders;
}

function saveOrders(data) {
    orders = data;
}

/* =========================================
   HOME
========================================= */

app.get("/", (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "index.html"
        )
    );

});

app.get("/admin", (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "admin.html"
        )
    );

});

/* =========================================
   GET ORDERS
========================================= */

app.get("/get-orders", (req, res) => {

    try {

        const orders = readOrders();

        res.json(orders);

    } catch (err) {

        console.log(err);

        res.status(500).json({
            success: false
        });

    }

});

/* =========================================
   API ORDERS
========================================= */

app.get("/api/orders", (req, res) => {

    try {

        const orders = readOrders();

        res.json(orders);

    } catch (err) {

        console.log(err);

        res.status(500).json({
            success: false
        });

    }

});

/* =========================================
   CREATE ORDER
========================================= */

app.post(

    "/api/order",

    upload.fields([

        { name: "frontImg", maxCount: 1 },
        { name: "backImg", maxCount: 1 },
        { name: "rightImg", maxCount: 1 },
        { name: "leftImg", maxCount: 1 },

        { name: "ownershipFrontImg", maxCount: 1 },
        { name: "ownershipBackImg", maxCount: 1 },

        { name: "insuranceImg", maxCount: 1 }

    ]),

    async (req, res) => {

        try {

            const orders = readOrders();

            const orderId =
                Date.now().toString();

            const files =
                req.files || {};

            async function uploadToCloudinary(file) {

                if (!file) return "";

                return new Promise((resolve, reject) => {

                    cloudinary.uploader.upload_stream(

                        {
                            folder: "amer-on-road"
                        },

                        (error, result) => {

                            if (error) {

                                reject(error);

                            } else {

                                resolve(result.secure_url);

                            }

                        }

                    ).end(file.buffer);

                });

            }

            const order = {

                id: orderId,

                phone:
                    req.body.phone || "",

                service:
                    req.body.service || "",

                problem:
                    req.body.problem || "",

                location:
                    req.body.location || "",

                latitude:
                    req.body.latitude || "",

                longitude:
                    req.body.longitude || "",

                status: "جديد",

                createdAt: new Date(),

                messages: [],

                files: {

                    frontImg:
                        await uploadToCloudinary(
                            files.frontImg?.[0]
                        ),

                    backImg:
                        await uploadToCloudinary(
                            files.backImg?.[0]
                        ),

                    rightImg:
                        await uploadToCloudinary(
                            files.rightImg?.[0]
                        ),

                    leftImg:
                        await uploadToCloudinary(
                            files.leftImg?.[0]
                        ),

                    ownershipFrontImg:
                        await uploadToCloudinary(
                            files.ownershipFrontImg?.[0]
                        ),

                    ownershipBackImg:
                        await uploadToCloudinary(
                            files.ownershipBackImg?.[0]
                        ),

                    insuranceImg:
                        await uploadToCloudinary(
                            files.insuranceImg?.[0]
                        )

                }

            };

            orders.unshift(order);

            saveOrders(orders);

            res.json({

                success: true,

                orderId

            });

        } catch (err) {

            console.log(err);

            res.status(500).json({

                success: false,

                error: "SERVER_ERROR"

            });

        }

    }

);

/* =========================================
   CHAT FILE UPLOAD
========================================= */

app.post(

    "/api/chat-upload",

    upload.single("file"),

    async (req, res) => {

        try {

            if (!req.file) {

                return res.json({
                    success: false
                });

            }

            const result =
                await new Promise((resolve, reject) => {

                    cloudinary.uploader.upload_stream(

                        {
                            folder: "amer-chat"
                        },

                        (error, result) => {

                            if (error) {

                                reject(error);

                            } else {

                                resolve(result);

                            }

                        }

                    ).end(req.file.buffer);

                });

            let type = "file";

            if (
                req.file.mimetype.startsWith("image/")
            ) {

                type = "image";

            }

            else if (

                req.file.mimetype.startsWith("audio/")
                ||
                req.file.mimetype.includes("webm")

            ) {

                type = "audio";

            }

            res.json({

                success: true,

                url: result.secure_url,

                type

            });

        } catch (err) {

            console.log(err);

            res.status(500).json({
                success: false
            });

        }

    }

);

/* =========================================
   UPDATE STATUS
========================================= */

app.post(

    "/api/update-status",

    (req, res) => {

        try {

            const {
                orderId,
                status
            } = req.body;

            const orders =
                readOrders();

            const order =
                orders.find(
                    o => o.id == orderId
                );

            if (!order) {

                return res.json({
                    success: false
                });

            }

            order.status = status;

            saveOrders(orders);

            res.json({
                success: true
            });

        } catch (err) {

            console.log(err);

            res.status(500).json({
                success: false
            });

        }

    }

);

/* =========================================
   404
========================================= */

app.use((req, res) => {

    res.status(404).json({

        success: false,

        error: "404 NOT FOUND"

    });

});

/* =========================================
   EXPORT FOR VERCEL
========================================= */

module.exports = app;

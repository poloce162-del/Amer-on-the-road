/* =========================================
   SERVER READY FIXED FINAL
========================================= */

const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

const io = new Server(server,{
    cors:{
        origin:"*"
    }
});

/* =========================================
   PORT
========================================= */

const PORT = process.env.PORT || 3000;

/* =========================================
   FOLDERS
========================================= */

const uploadsDir =
path.join(__dirname,'uploads');

const soundsDir =
path.join(__dirname,'sounds');

if(!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir);
}

if(!fs.existsSync(soundsDir)){
    fs.mkdirSync(soundsDir);
}

/* =========================================
   DATABASE FILES
========================================= */

const ordersFile =
path.join(__dirname,'orders.json');

if(!fs.existsSync(ordersFile)){

    fs.writeFileSync(
        ordersFile,
        JSON.stringify([],null,2)
    );
}

/* =========================================
   MIDDLEWARE
========================================= */

app.use(express.json({
    limit:'50mb'
}));

app.use(express.urlencoded({
    extended:true,
    limit:'50mb'
}));

/* =========================================
   STATIC FILES
========================================= */

/* ===== PUBLIC ===== */

app.use(
    express.static(
        path.join(__dirname,'public')
    )
);

/* ===== ROOT ===== */

app.use(express.static(__dirname));

/* ===== UPLOADS ===== */

app.use(
    '/uploads',
    express.static(uploadsDir)
);

/* ===== SOUNDS ===== */

app.use(
    '/sounds',
    express.static(soundsDir)
);

/* ===== LEAFLET FIX ===== */

app.use(
    '/leaflet',
    express.static(
        path.join(
            __dirname,
            'node_modules',
            'leaflet',
            'dist'
        )
    )
);

/* =========================================
   STORAGE
========================================= */

const storage = multer.diskStorage({

    destination:(req,file,cb)=>{

        cb(null,uploadsDir);

    },

    filename:(req,file,cb)=>{

        const unique =
        Date.now() +
        '_' +
        Math.floor(Math.random()*999999);

        cb(
            null,
            unique +
            path.extname(file.originalname)
        );
    }
});

const upload = multer({

    storage,

    limits:{
        fileSize:20 * 1024 * 1024
    }

});

/* =========================================
   FUNCTIONS
========================================= */

function readOrders(){

    try{

        const data =
        fs.readFileSync(
            ordersFile,
            'utf8'
        );

        return JSON.parse(data || '[]');

    }catch(err){

        console.log(err);

        return [];
    }
}

function saveOrders(data){

    fs.writeFileSync(
        ordersFile,
        JSON.stringify(data,null,2)
    );
}

/* =========================================
   HOME
========================================= */

app.get('/',(req,res)=>{

    res.sendFile(
        path.join(
            __dirname,
            'index.html'
        )
    );

});

app.get('/admin',(req,res)=>{

    res.sendFile(
        path.join(
            __dirname,
            'admin.html'
        )
    );

});

/* =========================================
   GET ORDERS
========================================= */

app.get('/get-orders',(req,res)=>{

    try{

        const orders = readOrders();

        res.json(orders);

    }catch(err){

        console.log(err);

        res.status(500).json({
            success:false
        });

    }

});

/* =========================================
   API ORDERS
========================================= */

app.get('/api/orders',(req,res)=>{

    try{

        const orders = readOrders();

        res.json(orders);

    }catch(err){

        console.log(err);

        res.status(500).json({
            success:false
        });

    }

});

/* =========================================
   CREATE ORDER
========================================= */

app.post(

'/api/order',

upload.fields([

    { name:'frontImg', maxCount:1 },
    { name:'backImg', maxCount:1 },
    { name:'rightImg', maxCount:1 },
    { name:'leftImg', maxCount:1 },

    { name:'ownershipFrontImg', maxCount:1 },
    { name:'ownershipBackImg', maxCount:1 },

    { name:'insuranceImg', maxCount:1 }

]),

(req,res)=>{

    try{

        const orders = readOrders();

        const orderId =
        Date.now().toString();

        const files =
        req.files || {};

        const order = {

            id:orderId,

            phone:
            req.body.phone || '',

            service:
            req.body.service || '',

            problem:
            req.body.problem || '',

            location:
            req.body.location || '',

            latitude:
            req.body.latitude || '',

            longitude:
            req.body.longitude || '',

            status:'جديد',

            createdAt:new Date(),

            messages:[],

            files:{

                frontImg:
                files.frontImg?.[0]?.filename || '',

                backImg:
                files.backImg?.[0]?.filename || '',

                rightImg:
                files.rightImg?.[0]?.filename || '',

                leftImg:
                files.leftImg?.[0]?.filename || '',

                ownershipFrontImg:
                files.ownershipFrontImg?.[0]?.filename || '',

                ownershipBackImg:
                files.ownershipBackImg?.[0]?.filename || '',

                insuranceImg:
                files.insuranceImg?.[0]?.filename || ''

            }

        };

        orders.unshift(order);

        saveOrders(orders);

        io.emit(
            'newOrder',
            order
        );

        res.json({

            success:true,

            orderId

        });

    }catch(err){

        console.log(err);

        res.status(500).json({

            success:false,

            error:'SERVER_ERROR'

        });

    }

});

/* =========================================
   CHAT FILE UPLOAD
========================================= */

app.post(

'/api/chat-upload',

upload.single('file'),

(req,res)=>{

    try{

        if(!req.file){

            return res.json({
                success:false
            });
        }

        const fileUrl =
        '/uploads/' +
        req.file.filename;

        let type = 'file';

        if(
            req.file.mimetype.startsWith('image/')
        ){

            type = 'image';

        }

        else if(

            req.file.mimetype.startsWith('audio/')
            ||
            req.file.mimetype.includes('webm')

        ){

            type = 'audio';

        }

        res.json({

            success:true,

            url:fileUrl,

            type

        });

    }catch(err){

        console.log(err);

        res.status(500).json({
            success:false
        });

    }

});

/* =========================================
   UPDATE STATUS
========================================= */

app.post(

'/api/update-status',

(req,res)=>{

    try{

        const {
            orderId,
            status
        } = req.body;

        const orders =
        readOrders();

        const order =
        orders.find(
            o=>o.id == orderId
        );

        if(!order){

            return res.json({
                success:false
            });
        }

        order.status = status;

        saveOrders(orders);

        io.to(orderId).emit(
            'orderStatusUpdate',
            {
                orderId,
                status
            }
        );

        res.json({
            success:true
        });

    }catch(err){

        console.log(err);

        res.status(500).json({
            success:false
        });

    }

});

/* =========================================
   SOCKET IO
========================================= */

io.on('connection',(socket)=>{

    console.log(
        'Client Connected:',
        socket.id
    );

    /* ===== JOIN ROOM ===== */

    socket.on(

    'joinOrderRoom',

    ({ orderId })=>{

        socket.join(orderId);

        console.log(
            'JOIN ROOM:',
            orderId
        );

    });

    /* ===== SEND MESSAGE ===== */

    socket.on(

    'sendMessage',

    (data)=>{

        try{

            const {

                orderId,
                sender,
                message,
                type

            } = data;

            const msg = {

                id:
                Date.now().toString(),

                sender,

                message,

                type:
                type || 'text',

                createdAt:
                new Date()

            };

            const orders =
            readOrders();

            const order =
            orders.find(
                o=>o.id == orderId
            );

            if(order){

                if(!order.messages){

                    order.messages = [];
                }

                order.messages.push(msg);

                saveOrders(orders);
            }

            io.to(orderId).emit(

                'newMessage',

                {
                    orderId,
                    ...msg
                }

            );

        }catch(err){

            console.log(err);

        }

    });

    /* ===== TYPING ===== */

    socket.on(

    'typing',

    (data)=>{

        socket
        .to(data.orderId)
        .emit('typing',data);

    });

    /* ===== QUICK ORDER ===== */

    socket.on(

    'createQuickOrder',

    (data)=>{

        try{

            const orders =
            readOrders();

            const order = {

                id:
                Date.now().toString(),

                phone:
                data.phone || '',

                service:
                data.service || '',

                problem:
                data.problem || '',

                location:
                data.location || '',

                latitude:
                data.latitude || '',

                longitude:
                data.longitude || '',

                status:'جديد',

                createdAt:new Date(),

                messages:[]

            };

            orders.unshift(order);

            saveOrders(orders);

            socket.emit(

                'quickOrderCreated',

                {
                    success:true,
                    order
                }

            );

            io.emit(
                'newOrder',
                order
            );

        }catch(err){

            console.log(err);

        }

    });

    /* ===== DISCONNECT ===== */

    socket.on('disconnect',()=>{

        console.log(
            'Client Disconnected:',
            socket.id
        );

    });

});

/* =========================================
   404
========================================= */

app.use((req,res)=>{

    res.status(404).json({

        success:false,

        error:'404 NOT FOUND'

    });

});

/* =========================================
   START SERVER
========================================= */

server.listen(PORT,()=>{

    console.log(`

=========================================
SERVER RUNNING
PORT: ${PORT}
=========================================

`);

});
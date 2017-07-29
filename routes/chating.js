var IO = require('socket.io');
//import IO                   from 'socket.io';

module.exports = (server) => {
    const roomNum = 0;
    const io = IO(server, {path: '/room'});

    io.on('connection', function(socket) {
        console.log('connected');

        socket.on('postChat', (params) => {
            console.log('message : ' + params);
            //console.log(socket);
            io.emit('getChat', params);
        });
    });
}
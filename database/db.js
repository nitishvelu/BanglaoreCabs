

const PORT = process.env.PORT || 4000; // temp port
const express = require("express");
const app = express();
const amqp = require("amqplib");
const { PrismaClient } = require('@prisma/client');


app.use(express.json());

const prisma = new PrismaClient()

var channel, connection;

connect();
async function connect() {
  try {
    const amqpServer = process.env.AMQP_URL;
    connection = await amqp.connect(amqpServer);
    channel = await connection.createChannel();
    await channel.assertQueue("db");
    channel.prefetch(1);

     channel.consume(
      "db",
      async ( data) => {
        channel.ack(data);

        res = JSON.parse(Buffer.from(data.content).toString());
        const { cost, pickup, destination,seats,time,name} = res
        // console.log(name);

        const ride = await prisma.ride.create({
       data: {
        cost: Number(cost),
        pickup:pickup,
        destination:destination,
        seats:Number(seats),
        time:Number(time),
        name:name,
    },
  })

      
      },
      {
        noAck: false,
      }
    );
  } catch (error) {
    console.error(error);
  }
}

app.get('/ride', async (req, res) => {
  const rides = await prisma.ride.findMany({
    orderBy: {createdAt: "desc"}
  })
  res.json(rides)
})

app.listen(PORT, () => {
  console.log(`database server at ${PORT}`);
});

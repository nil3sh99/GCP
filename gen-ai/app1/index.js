import express from 'express';

// create a new application instance
const app = express();


app.get('/', async (req, res) => {
    res.send('Hello world');
})

// env variable - choose between cloud run env or local host
const port = parseInt(process.env.PORT) || 8080;

// run the application
app.listen(port, () => {
    // ` ` backticks allows us to use env variable
    console.log(`codelab-genai: listening on port ${port}`);
})
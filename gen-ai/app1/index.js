// import express from 'express';

// // create a new application instance
// const app = express();


// app.get('/', async (req, res) => {
//     res.send('Hello world');
// })

// // env variable - choose between cloud run env or local host
// const port = parseInt(process.env.PORT) || 8080;

// // run the application
// app.listen(port, () => {
//     // ` ` backticks allows us to use env variable
//     console.log(`codelab-genai: listening on port ${port}`);
// })

// modified code for gen-ai application
import express from 'express';
const app = express();

import { VertexAI } from '@google-cloud/vertexai';

import { GoogleAuth } from 'google-auth-library';
const auth = new GoogleAuth();

app.get('/', async (req, res) => {
    const project = await auth.getProjectId();

    // create an instance of vertexAI class
    const vertex = new VertexAI({ project: project });
    
    // create a genAI model
    const generativeModel = vertex.getGenerativeModel({
        model: 'gemini-1.5-flash'
    });

    // how to create a query string '?'
    // go to URL where the application is deployed
    // localhost:8080?animal=flamingo
    const animal = req.query.animal || 'dog';
    
    const prompt = `Give me 10 fun facts about ${animal}. Return this as html without backticks.`
    const resp = await generativeModel.generateContent(prompt);
    const html = resp.response.candidates[0].content.parts[0].text;
    res.send(html);
});

const port = parseInt(process.env.PORT) || 8080;
app.listen(port, () => {
    console.log(`codelab-genai: listening on port ${port}`);
});
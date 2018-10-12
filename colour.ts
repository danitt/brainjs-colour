import * as Brain from 'brain.js';
import * as inquirer from 'inquirer';
import * as Ora from 'ora';
import * as toHex from 'colornames';

// Initialisation
const ora = Ora();
const net = new Brain.NeuralNetwork();

// Entry Point
(async () => {
  await chooseColour();
  process.exit();
})();

async function chooseColour() {
  const answers = await inquirer
    .prompt([
      {
        message: 'Enter a colour name',
        name: 'colour',
        type: 'input',
        validate: input => !!input,
        default: 'black',
      },
    ]);
  ora.start('Training Neural Network..');
  await trainNetwork();
  ora.succeed('NN Trained');

  const colour = String(answers.colour).toUpperCase();
  const rgb = colourToRgb(colour);
  const result = await calculateBestContrast(rgb);
  ora.succeed(`Best contrast for ${colour} is: ${result}`);
}

function colourToRgb(colour: String) {
  let hex = toHex(colour);
  // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  const rgb = result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
  Object.keys(rgb).map(key => {
    rgb[key] = +(rgb[key] / 255).toFixed(2);
  });
  return rgb;
}

async function trainNetwork() {
  const trainingSet = [
    { input: { r: 0.0, g: 0.0, b: 0.0 }, output: { white: 1 } },
    { input: { r: 1.0, g: 1.0, b: 1.0 }, output: { black: 1 } },
    { input: { r: 0.03, g: 0.7, b: 0.5 }, output: { black: 1 } },
    { input: { r: 0.16, g: 0.09, b: 0.2 }, output: { white: 1 } },
    { input: { r: 0.5, g: 0.5, b: 1.0 }, output: { white: 1 } },
    { input: { r: 0.07, g: 0.34, b: 0.0 }, output: { white: 1 } },
    { input: { r: 1.0, g: 0.50, b: 0.50 }, output: { black: 1 } }
  ];

  net.train(trainingSet, {
    iterations: 20000,
    errorThresh: 0.005,
    log: false,
    logPeriod: 10,
    learningRate: 0.3,
    momentum: 0.1,
    callback: null,
    callbackPeriod: 10,
    timeout: Infinity,
  });
}

async function calculateBestContrast(rgb: any): Promise<'WHITE' | 'BLACK'> {
  const output: any = net.run(rgb);
  const result = output.white > output.black ? 'WHITE' : 'BLACK';
  return result;
}
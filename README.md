# ClassappChallenge
Author: Lucas dos Santos Ramos

This code implements a solution for the challenge found in: https://gist.github.com/lucas-brito/84a77f08115ae4b9b034c010ff2a2ab4

To run this code use:
- npm install - to install all the dependencies required
- node index.js - to run the script

## Input / Output
By the challenge proposed in the link cited above, our goal is to get the "input.csv" file and generate automatically the file "output.json" with out hard code the tags or the index of the columns.

## Solution
The solution for the challenge is divided in two steps:
1. Read the heading of the cvs file to create the mapping between the name of the columns and their position in the file.
2. Read the rest of the csv file using the mapping to know which column we are currently on so then it is possible to strutuct everything in a JSON file.

Special thanks to ClassApp for giving me this opportunity !
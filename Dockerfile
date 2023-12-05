# Use an official Node.js runtime as a parent image
FROM node:19

# Set the working directory in the container
WORKDIR .

# Copies package.json and tsconfig.json to the container
COPY package*.json ./
COPY tsconfig.json ./

# Clean Install (ci) the packages from package.json
RUN npm install

# Copy the rest of the application code to the container
COPY .. .

# Solve tsc error
ENV NODE_ENV=production

# Build the TypeScript code
RUN npm install --save-dev typescript
RUN npx -p typescript tsc --init

# Define the command to run your application
CMD ["ts-node", "src/index.ts"]

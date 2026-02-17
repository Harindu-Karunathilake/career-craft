# Running with Docker

This project supports running in a containerized environment using Docker Compose. This effectively runs the frontend in **production mode** and the backend using **Firebase Emulators**.

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop) installed and running.

## Running the App

Run the following command in the project root:

```bash
docker-compose up --build
```

This will build both images and start the services.

## Services

- **Frontend**: Accessible at [http://localhost:3000](http://localhost:3000).
- **Firebase Emulators UI**: Accessible at [http://localhost:4000](http://localhost:4000).
- **Cloud Functions**: Listening on port `5001`.
- **Firestore**: Listening on port `8081`.
- **Auth**: Listening on port `9099`.

## Important Notes

1. **Production Mode**: The frontend runs in production mode (`npm start`), so hot reloading (HMR) is **disabled**. You will need to rebuild the container to see changes (`docker-compose up --build`).
2. **Environment Variables**: Docker Compose sets `NEXT_PUBLIC_USE_EMULATORS=true` automatically, ensuring the frontend connects to the local backend container.
3. **Data Persistence**: Currently, emulator data is not persisted between restarts. To enable persistence, you would need to mount a volume and use `--import/--export-on-exit` flags in the backend Dockerfile.

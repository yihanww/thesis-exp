# fastapi-jspsych-experiment-template
Simple generic experiment template using FastAPI, SQLModel, and jspsych.

# Instructions
## Initial setup
1. Clone or download this repo.
2. Set up a Python environment: `python -m venv env`
3. Activate that environment: `source env/bin/activate`
4. Install required packages: `pip install -r requirements.txt`
5. Initialize/reset the local database: `python cli.py reset_db`
6. Install frontend packages: `python cli.py install_packages` OR from within `frontend/`: `npm i`

## Set the environment variables
This should be done locally in a `.env` file. If using a deployment on Railway, can be done online via their GUI.
Note that you will need to change the `Settings` object within `config.py` to look for those variables of interest, and then point to those within `ExperimentConfiguration` in `main.py`.

## Run locally
- In one terminal, start the frontend server: `python cli.py debug` OR from within `frontend/`: `npm run dev`
- In another, separate terminal, start the backend server: `python cli.py run`
- Once both terminals are running, you can see the experiment locally at: http://localhost:8000/exp?workerId=XXX&assignmentId=XXX&hitId=XXX
  - It won't work without the query parameters specifying `workerId` and so on. This is for your convenience when you run the experiment, so you can automatically get that information from participants without their needing to enter it.
  - You can always modify the frontend to make these parameters optional! I prefer when they are mandatory, so I don't forget to make them mandatory once again at deploy time (though of course in future iterations I may supply dummy credentials while in development mode, if I get around to it).

## Deploy
1. Create a Railway account: https://railway.app
2. From the Railway website, select your repo for deployment.
3. In the app's settings, you will need to select the appropriate branch (master/main would be the default)
4. Attach a Postgres database instance
5. Set up your environment variables (including a reference to the Postgres instance at `DATABASE_URL`)

## Set up link with Railway from terminal
- Install the Railway CLI if you don't already have it: `npm i -g @railway/cli`
- `railway login` (login to the service)
- `railway link` (choose the relevant project)
- `railway shell` (gives you access to the environment variables you set on Railway when performing `railway run` commands)
- Reset the database online: `railway run python cli.py reset_db`

## Export your data
`railway run python cli.py export`

## Notes
- The current setup has a one-to-one relationship between participants and data. However, if a participant should run the experiment multiple times, their data will still be saved -- it just means that the participant table will only be associated with the latest version of the data. This is a design choice that can be changed by modifying the `Participant` and `Data` models in `models.py`.# thesis

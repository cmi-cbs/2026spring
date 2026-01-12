# Capital Markets & Investments - Course Figures

This repository contains Jupyter notebooks that generate figures and visualizations for the Capital Markets & Investments course.

## Structure

```
capital-markets-investments/
├── sessions/          # Jupyter notebooks for each session
│   ├── session_01.ipynb
│   ├── session_02.ipynb
│   └── ...
├── figures/          # Generated figures organized by session
│   ├── session_01/
│   ├── session_02/
│   └── ...
├── .env              # Your API keys (DO NOT COMMIT)
└── .env.example      # Template for environment variables
```

## Setup

1. Clone this repository
2. Create a virtual environment (recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install required packages:
   ```bash
   pip install jupyter pandas numpy matplotlib seaborn fredapi python-dotenv requests
   ```

4. Set up your API keys:
   - Get a free FRED API key from [FRED](https://fred.stlouisfed.org/docs/api/api_key.html)
   - Get a free BEA API key from [BEA](https://apps.bea.gov/api/signup/)
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Edit `.env` and add your actual API keys

5. Start Jupyter:
   ```bash
   jupyter notebook
   ```

## Usage

Each session has its own notebook in the `sessions/` directory. Run the notebook to generate figures, which will be automatically saved to the corresponding folder in `figures/`.

## Important

Never commit your `.env` file - it contains your API keys and is excluded via `.gitignore`.

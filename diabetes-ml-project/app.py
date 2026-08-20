"""
app.py
======

API FastAPI qui expose le modèle entraîné (models/model.joblib) via un
endpoint /predict.

⚠️ Rappel important (voir aussi /) :
Ce projet utilise le dataset de recherche "Pima Indians Diabetes" à but
pédagogique. Les prédictions de cette API n'ont AUCUNE valeur diagnostique
et ne doivent pas être utilisées pour évaluer l'état de santé réel d'une
personne. Consultez toujours un professionnel de santé.

Lancer l'API en local :
    uvicorn app:app --reload

Documentation interactive auto-générée :
    http://127.0.0.1:8000/docs
"""

from pathlib import Path

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

# L'import de preprocessing est nécessaire même s'il semble "inutilisé" :
# joblib a besoin de retrouver la classe ZeroToNaNTransformer utilisée
# dans le pipeline sauvegardé pour pouvoir le désérialiser.
from preprocessing import ZeroToNaNTransformer  # noqa: F401

MODEL_PATH = Path("models/model.joblib")

AVERTISSEMENT = (
    "Ce resultat provient d'un modele entraine sur un dataset de recherche "
    "(Pima Indians Diabetes, annees 1990, population specifique). Il s'agit "
    "d'un projet pedagogique : ce resultat ne constitue PAS un diagnostic "
    "medical et ne permet pas de conclure qu'une personne donnee est "
    "diabetique. Consultez un professionnel de sante pour toute question "
    "medicale."
)

app = FastAPI(
    title="API de prédiction du diabète (projet pédagogique)",
    description=(
        "API de démonstration basée sur le dataset Pima Indians Diabetes. "
        "USAGE EDUCATIF UNIQUEMENT — voir le champ 'avertissement' de chaque "
        "réponse."
    ),
    version="1.0.0",
)

# Chargement du modèle au démarrage de l'API (une seule fois, pas à chaque requête)
if not MODEL_PATH.exists():
    raise FileNotFoundError(
        f"Modèle introuvable à {MODEL_PATH}. "
        "Lance d'abord `python train.py` pour l'entraîner et le générer."
    )
pipeline = joblib.load(MODEL_PATH)


class PatientInput(BaseModel):
    """
    Schéma des données d'entrée, correspondant aux colonnes du dataset
    Pima Indians Diabetes.
    """

    Pregnancies: int = Field(..., ge=0, description="Nombre de grossesses")
    Glucose: float = Field(..., ge=0, description="Concentration en glucose plasmatique")
    BloodPressure: float = Field(..., ge=0, description="Pression artérielle diastolique (mm Hg)")
    SkinThickness: float = Field(..., ge=0, description="Épaisseur du pli cutané tricipital (mm)")
    Insulin: float = Field(..., ge=0, description="Insuline sérique à 2h (mu U/ml)")
    BMI: float = Field(..., ge=0, description="Indice de masse corporelle")
    DiabetesPedigreeFunction: float = Field(..., ge=0, description="Fonction de pedigree du diabète")
    Age: int = Field(..., ge=0, description="Âge en années")

    class Config:
        json_schema_extra = {
            "example": {
                "Pregnancies": 6,
                "Glucose": 148,
                "BloodPressure": 72,
                "SkinThickness": 35,
                "Insulin": 0,
                "BMI": 33.6,
                "DiabetesPedigreeFunction": 0.627,
                "Age": 50,
            }
        }


class PredictionOutput(BaseModel):
    prediction: int = Field(..., description="0 = non diabétique (classe prédite), 1 = diabétique (classe prédite)")
    probabilite_diabete: float = Field(..., description="Probabilité estimée de la classe 'diabétique' (0 à 1)")
    avertissement: str


@app.get("/")
def racine():
    return {
        "message": "API de prédiction du diabète - projet pédagogique",
        "dataset": "Pima Indians Diabetes (dataset de recherche, non représentatif de la population générale)",
        "avertissement": AVERTISSEMENT,
        "documentation": "/docs",
    }


@app.get("/health")
def health():
    """Endpoint de vérification que l'API et le modèle sont chargés correctement."""
    return {"status": "ok", "modele_charge": MODEL_PATH.exists()}


@app.post("/predict", response_model=PredictionOutput)
def predict(patient: PatientInput):
    """
    Prend en entrée les caractéristiques d'un patient et retourne une
    prédiction du modèle. Le preprocessing (gestion des 0 manquants,
    imputation, standardisation) est appliqué automatiquement par le
    pipeline sauvegardé — aucune transformation manuelle n'est nécessaire ici.
    """
    try:
        donnees = pd.DataFrame([patient.model_dump()])
        prediction = int(pipeline.predict(donnees)[0])
        probabilite = float(pipeline.predict_proba(donnees)[0][1])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la prédiction : {e}")

    return PredictionOutput(
        prediction=prediction,
        probabilite_diabete=round(probabilite, 4),
        avertissement=AVERTISSEMENT,
    )

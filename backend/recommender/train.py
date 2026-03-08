import os
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.utils.class_weight import compute_sample_weight
import joblib
import xgboost as xgb

try:
    import mlflow
    import mlflow.sklearn
    HAS_MLFLOW = True
except ImportError:
    HAS_MLFLOW = False



def train_model():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    data_path = os.path.join(current_dir, "investor_profiles.csv")
    model_output_path = os.path.join(current_dir, "user_classifier.pkl")
    
    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Data not found at {data_path}. Run data_generator.py first.")
        
    df = pd.read_csv('recommender/training_data_final.csv')
    print(f"Dataset loaded: {len(df)} samples")
    print(f"Class distribution:\n{df['User_Class'].value_counts()}\n")
    
    # Encode categorical features
    goal_encoder = LabelEncoder()
    goal_encoder.classes_ = np.array(['Education', 'Income', 'Retirement', 'Tax', 'Wealth'])
    
    feature_cols = ['Age', 'Income', 'Risk_Tolerance', 'Investment_Goal_Encoded']
    
    # Add Experience_Years if available
    if 'Experience_Years' in df.columns:
        feature_cols.append('Experience_Years')
    
    X = df[feature_cols]
    
    # XGBoost requires target classes to be numeric (0, 1, 2)
    label_encoder = LabelEncoder()
    y = label_encoder.fit_transform(df['User_Class'])
    
    # --- Compare Models with 5-fold Cross-Validation ---
    print("=" * 60)
    print("MODEL COMPARISON (5-Fold Cross-Validation)")
    print("=" * 60)
    
    models = {
        "Random Forest": RandomForestClassifier(
            n_estimators=200, max_depth=15, random_state=42, n_jobs=-1
        ),
        "Gradient Boosting": GradientBoostingClassifier(
            n_estimators=150, max_depth=5, learning_rate=0.1, random_state=42
        ),
        "XGBoost": xgb.XGBClassifier(
            n_estimators=200, max_depth=6, learning_rate=0.1, random_state=42, use_label_encoder=False, eval_metric='mlogloss'
        )
    }
    
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    best_model_name = None
    best_score = 0
    best_model = None
    
    for name, model in models.items():
        scores = cross_val_score(model, X, y, cv=cv, scoring='accuracy')
        mean_acc = scores.mean()
        std_acc = scores.std()
        print(f"\n{name}:")
        print(f"  Accuracy: {mean_acc:.4f} (+/- {std_acc:.4f})")
        print(f"  Fold scores: {[f'{s:.4f}' for s in scores]}")
        
        if mean_acc > best_score:
            best_score = mean_acc
            best_model_name = name
            best_model = model
    
    print(f"\n{'=' * 60}")
    print(f"WINNER: {best_model_name} (CV Accuracy: {best_score:.4f})")
    print(f"{'=' * 60}")
    
    # --- Final Training on Full Train Set ---
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    # Calculate sample weights for class imbalance
    sample_weights = compute_sample_weight(
        class_weight='balanced',
        y=y_train
    )
    
    # Fit considering severe class imbalances
    best_model.fit(X_train, y_train, sample_weight=sample_weights)
    y_pred_num = best_model.predict(X_test)
    
    final_acc = accuracy_score(y_test, y_pred_num)
    
    # Decode labels for reporting
    y_test_labels = label_encoder.inverse_transform(y_test)
    y_pred_labels = label_encoder.inverse_transform(y_pred_num)
    class_names = list(label_encoder.classes_)
    
    # MLflow logging
    if HAS_MLFLOW:
        try:
            mlflow.set_tracking_uri("mlruns")
            mlflow.set_experiment("Cresta_User_Classification")
            
            with mlflow.start_run():
                mlflow.log_param("model_type", best_model_name)
                mlflow.log_param("n_samples", len(df))
                mlflow.log_param("features", feature_cols)
                mlflow.log_metric("cv_accuracy", best_score)
                mlflow.log_metric("test_accuracy", final_acc)
                mlflow.sklearn.log_model(best_model, "best_model")
        except Exception as e:
            print(f"MLflow logging skipped: {e}")
    
    # Print detailed report
    print(f"\n{'=' * 60}")
    print(f"FINAL TEST RESULTS ({best_model_name})")
    print(f"{'=' * 60}")
    print(f"Test Accuracy: {final_acc:.4f}")
    print(f"\nClassification Report:")
    print(classification_report(y_test_labels, y_pred_labels))
    
    print("Confusion Matrix:")
    cm = confusion_matrix(y_test_labels, y_pred_labels, labels=class_names)
    cm_df = pd.DataFrame(cm, index=class_names, columns=class_names)
    print(cm_df)
    
    # Feature importance
    if hasattr(best_model, 'feature_importances_'):
        print(f"\nFeature Importance:")
        for feat, imp in sorted(zip(feature_cols, best_model.feature_importances_), key=lambda x: -x[1]):
            bar = "█" * int(imp * 50)
            print(f"  {feat:30s} {imp:.4f} {bar}")
    
    # Save model with metadata
    export_data = {
        'model': best_model,
        'goal_encoder': goal_encoder,
        'label_encoder': label_encoder,
        'feature_columns': feature_cols,
        'metadata': {
            'model_type': best_model_name,
            'cv_accuracy': round(best_score, 4),
            'test_accuracy': round(final_acc, 4),
            'n_samples': len(df),
            'classes': class_names
        }
    }
    joblib.dump(export_data, model_output_path)
    print(f"\nModel exported to {model_output_path}")
    print(f"Metadata: {export_data['metadata']}")


if __name__ == "__main__":
    train_model()

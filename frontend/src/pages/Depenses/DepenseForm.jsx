// frontend/src/pages/Depenses/DepenseForm.jsx
// Formulaire pour créer une dépense

import { useState } from 'react';

const CATEGORIES = [
  'Salaires',
  'Eau',
  'Électricité',
  'Carburant',
  'Loyer',
  'Maintenance',
  'Fournitures',
  'Communication',
  'Divers'
];

export function DepenseForm({ onSubmit, onClose }) {
  const [formData, setFormData] = useState({
    montant: '',
    date_depense: new Date().toISOString().split('T')[0],
    categorie: 'Divers',
    description: '',
    piece_justificative_url: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.montant || parseFloat(formData.montant) <= 0) {
      newErrors.montant = 'Montant doit être > 0';
    }

    if (!formData.date_depense) {
      newErrors.date_depense = 'Date requise';
    }

    if (!formData.categorie) {
      newErrors.categorie = 'Catégorie requise';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Nouvelle Dépense</h2>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <i className="ti ti-x text-xl"></i>
        </button>
      </div>

      {/* Montant */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Montant (FCFA) <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          name="montant"
          value={formData.montant}
          onChange={handleChange}
          placeholder="500000"
          step="1000"
          min="0"
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
            errors.montant
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:ring-red-500'
          }`}
          disabled={loading}
        />
        {errors.montant && (
          <p className="text-red-500 text-sm mt-1">{errors.montant}</p>
        )}
        {formData.montant && (
          <p className="text-xs text-gray-500 mt-1">
            {(parseFloat(formData.montant) / 1000000).toFixed(2)}M FCFA
          </p>
        )}
      </div>

      {/* Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Date <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          name="date_depense"
          value={formData.date_depense}
          onChange={handleChange}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
            errors.date_depense
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:ring-red-500'
          }`}
          disabled={loading}
        />
        {errors.date_depense && (
          <p className="text-red-500 text-sm mt-1">{errors.date_depense}</p>
        )}
      </div>

      {/* Catégorie */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Catégorie <span className="text-red-500">*</span>
        </label>
        <select
          name="categorie"
          value={formData.categorie}
          onChange={handleChange}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
            errors.categorie
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:ring-red-500'
          }`}
          disabled={loading}
        >
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        {errors.categorie && (
          <p className="text-red-500 text-sm mt-1">{errors.categorie}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Détails de la dépense..."
          rows="2"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          disabled={loading}
        />
      </div>

      {/* Pièce justificative */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Lien pièce justificative
        </label>
        <input
          type="url"
          name="piece_justificative_url"
          value={formData.piece_justificative_url}
          onChange={handleChange}
          placeholder="https://..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          disabled={loading}
        />
        <p className="text-xs text-gray-500 mt-1">
          Lien vers facture, reçu, etc.
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-4 border-t">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          disabled={loading}
        >
          Annuler
        </button>
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
    </form>
  );
}

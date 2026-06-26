// frontend/src/pages/Recettes/RecetteForm.jsx
// Formulaire pour créer/enregistrer un versement

import { useState } from 'react';

export function RecetteForm({ filiales, onSubmit, onClose }) {
  const [formData, setFormData] = useState({
    filiale_id: '',
    montant: '',
    date_versement: new Date().toISOString().split('T')[0],
    mode_paiement: 'Virement',
    reference_paiement: '',
    observation: ''
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

    if (!formData.filiale_id) {
      newErrors.filiale_id = 'Filiale requise';
    }

    if (!formData.montant || parseFloat(formData.montant) <= 0) {
      newErrors.montant = 'Montant doit être > 0';
    }

    if (!formData.date_versement) {
      newErrors.date_versement = 'Date requise';
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
        <h2 className="text-xl font-bold">Enregistrer Versement</h2>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <i className="ti ti-x text-xl"></i>
        </button>
      </div>

      {/* Filiale */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Filiale <span className="text-red-500">*</span>
        </label>
        <select
          name="filiale_id"
          value={formData.filiale_id}
          onChange={handleChange}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
            errors.filiale_id
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:ring-green-500'
          }`}
          disabled={loading}
        >
          <option value="">-- Sélectionner une filiale --</option>
          {filiales.map((f) => (
            <option key={f.id} value={f.id}>
              {f.nom} ({f.code})
            </option>
          ))}
        </select>
        {errors.filiale_id && (
          <p className="text-red-500 text-sm mt-1">{errors.filiale_id}</p>
        )}
      </div>

      {/* Montant */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Montant (FCFA) <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            type="number"
            name="montant"
            value={formData.montant}
            onChange={handleChange}
            placeholder="5000000"
            step="1000"
            min="0"
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
              errors.montant
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:ring-green-500'
            }`}
            disabled={loading}
          />
        </div>
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
          name="date_versement"
          value={formData.date_versement}
          onChange={handleChange}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
            errors.date_versement
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:ring-green-500'
          }`}
          disabled={loading}
        />
        {errors.date_versement && (
          <p className="text-red-500 text-sm mt-1">{errors.date_versement}</p>
        )}
      </div>

      {/* Mode de paiement */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Mode de paiement
        </label>
        <select
          name="mode_paiement"
          value={formData.mode_paiement}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          disabled={loading}
        >
          <option value="Virement">Virement bancaire</option>
          <option value="Chèque">Chèque</option>
          <option value="Espèces">Espèces</option>
          <option value="Mobile Money">Mobile Money</option>
          <option value="Autre">Autre</option>
        </select>
      </div>

      {/* Référence */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Référence/Numéro
        </label>
        <input
          type="text"
          name="reference_paiement"
          value={formData.reference_paiement}
          onChange={handleChange}
          placeholder="Numéro de transaction, chèque..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          disabled={loading}
        />
      </div>

      {/* Observation */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Observation
        </label>
        <textarea
          name="observation"
          value={formData.observation}
          onChange={handleChange}
          placeholder="Notes additionnelles..."
          rows="2"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          disabled={loading}
        />
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
          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
    </form>
  );
}

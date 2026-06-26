// frontend/src/pages/Filiales/FilialeForm.jsx
// Formulaire pour créer ou éditer une filiale

import { useState } from 'react';

export function FilialeForm({ initialData, onSubmit, onClose }) {
  const [formData, setFormData] = useState(initialData || {
    code: '',
    nom: '',
    adresse: '',
    ville: '',
    region: '',
    latitude: '',
    longitude: '',
    telephone: '',
    email: '',
    statut: 'Active'
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    // Effacer erreur si présente
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.code.trim()) {
      newErrors.code = 'Code requis';
    }
    if (!formData.nom.trim()) {
      newErrors.nom = 'Nom requis';
    }
    if (!formData.ville.trim()) {
      newErrors.ville = 'Ville requise';
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
        <h2 className="text-xl font-bold">
          {initialData ? 'Modifier Filiale' : 'Créer Filiale'}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <i className="ti ti-x text-xl"></i>
        </button>
      </div>

      {/* Code */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Code <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="code"
          value={formData.code}
          onChange={handleChange}
          placeholder="DKR-001"
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
            errors.code
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:ring-red-500'
          }`}
          disabled={loading}
        />
        {errors.code && (
          <p className="text-red-500 text-sm mt-1">{errors.code}</p>
        )}
      </div>

      {/* Nom */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nom <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="nom"
          value={formData.nom}
          onChange={handleChange}
          placeholder="Dakar Centre"
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
            errors.nom
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:ring-red-500'
          }`}
          disabled={loading}
        />
        {errors.nom && <p className="text-red-500 text-sm mt-1">{errors.nom}</p>}
      </div>

      {/* Ville */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Ville <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="ville"
          value={formData.ville}
          onChange={handleChange}
          placeholder="Dakar"
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
            errors.ville
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:ring-red-500'
          }`}
          disabled={loading}
        />
        {errors.ville && (
          <p className="text-red-500 text-sm mt-1">{errors.ville}</p>
        )}
      </div>

      {/* Région */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Région
        </label>
        <input
          type="text"
          name="region"
          value={formData.region}
          onChange={handleChange}
          placeholder="Dakar"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          disabled={loading}
        />
      </div>

      {/* Adresse */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Adresse
        </label>
        <textarea
          name="adresse"
          value={formData.adresse}
          onChange={handleChange}
          placeholder="162 Sacré Cœur III VDN"
          rows="2"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          disabled={loading}
        />
      </div>

      {/* Téléphone */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Téléphone
        </label>
        <input
          type="tel"
          name="telephone"
          value={formData.telephone}
          onChange={handleChange}
          placeholder="+221 77 XXX XXXX"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          disabled={loading}
        />
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email
        </label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="contact@filiale.sn"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          disabled={loading}
        />
      </div>

      {/* Statut */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Statut
        </label>
        <select
          name="statut"
          value={formData.statut}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          disabled={loading}
        >
          <option value="Active">Active</option>
          <option value="Suspendue">Suspendue</option>
          <option value="Fermée">Fermée</option>
        </select>
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
          {loading ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
      </div>
    </form>
  );
}

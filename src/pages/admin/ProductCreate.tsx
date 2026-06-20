import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateProduct } from '../../hooks/useAdminProducts.js';
import { ProductForm } from '../../components/admin/ProductForm.js';
import { ArrowLeft } from 'lucide-react';

export const ProductCreate: React.FC = () => {
  const navigate = useNavigate();
  const createProduct = useCreateProduct();
  const [error, setError] = useState('');

  const handleSubmit = async (data: any) => {
    try {
      setError('');
      await createProduct.mutateAsync(data);
      navigate('/admin/products');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error creating product. Please check required fields and unique SKU/slugs.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/admin/products')}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-500" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Create Product</h1>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-100 text-sm">
          {error}
        </div>
      )}

      <ProductForm 
        onSubmit={handleSubmit} 
        isLoading={createProduct.isPending} 
      />
    </div>
  );
};

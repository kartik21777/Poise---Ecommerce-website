import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAdminProduct, useUpdateProduct } from '../../hooks/useAdminProducts.js';
import { ProductForm } from '../../components/admin/ProductForm.js';
import { ArrowLeft } from 'lucide-react';

export const ProductEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const { data: product, isLoading: isFetching } = useAdminProduct(id!);
  const updateProduct = useUpdateProduct();

  const handleSubmit = async (data: any) => {
    try {
      setError('');
      await updateProduct.mutateAsync({ id: id!, payload: data });
      navigate('/admin/products');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error updating product.');
    }
  };

  if (isFetching) {
    return <div className="p-8 text-center text-gray-500">Loading product...</div>;
  }

  if (!product) {
    return <div className="p-8 text-center text-red-500">Product not found.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/admin/products')}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-500" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Edit Product: {product.name}</h1>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-100 text-sm">
          {error}
        </div>
      )}

      <ProductForm 
        initialData={product}
        onSubmit={handleSubmit} 
        isLoading={updateProduct.isPending} 
      />
    </div>
  );
};

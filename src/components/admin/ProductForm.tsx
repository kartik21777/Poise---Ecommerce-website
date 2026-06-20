import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../services/apiClient.js';
import { Save, X, Plus, Trash2, ChevronUp, ChevronDown, Upload, Image as ImageIcon } from 'lucide-react';

interface ProductFormProps {
  initialData?: any;
  onSubmit: (data: any) => Promise<void>;
  isLoading: boolean;
}

export const ProductForm: React.FC<ProductFormProps> = ({ initialData, onSubmit, isLoading }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    slug: initialData?.slug || '',
    description: initialData?.description || '',
    shortDescription: initialData?.shortDescription || '',
    category: initialData?.category?.id || initialData?.category || '',
    brand: initialData?.brand || '',
    price: initialData?.price || 0,
    compareAtPrice: initialData?.compareAtPrice || 0,
    status: initialData?.status || 'draft',
    isFeatured: initialData?.isFeatured || false,
    lowStockThreshold: initialData?.lowStockThreshold || 5,
    metaTitle: initialData?.metaTitle || '',
    metaDescription: initialData?.metaDescription || '',
    tags: initialData?.tags?.join(', ') || '',
    images: initialData?.images || [],
    variants: initialData?.variants || []
  });

  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await apiClient.get('/categories');
      return res.data;
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const tagsArray = formData.tags
      ? formData.tags.split(',').map((t: string) => t.trim()).filter((t: string) => !!t)
      : [];
    
    // We expect the onSubmit to throw if backend fails
    await onSubmit({
      ...formData,
      tags: tagsArray,
      variants: formData.variants
    });

    // Clean up deleted images only on success
    for (const publicId of imagesToDelete) {
      try {
        await apiClient.post('/admin/products/delete-image', { public_id: publicId });
      } catch (err) {
        console.error('Failed to cleanup image', publicId);
      }
    }
    setImagesToDelete([]);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];
    
    setUploadingImage(true);
    try {
      const data = new FormData();
      data.append('image', file);
      
      const res = await apiClient.post('/admin/products/upload-image', data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, { public_id: res.data.public_id, secure_url: res.data.secure_url }]
      }));
    } catch (err) {
      alert('Failed to upload image');
    } finally {
      setUploadingImage(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    const targetImage = formData.images[index];
    setImagesToDelete(prev => [...prev, targetImage.public_id]);
    setFormData(prev => {
      const newImages = [...prev.images];
      newImages.splice(index, 1);
      return { ...prev, images: newImages };
    });
  };

  const handleMoveImage = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= formData.images.length) return;
    
    setFormData(prev => {
      const newImages = [...prev.images];
      const temp = newImages[index];
      newImages[index] = newImages[newIndex];
      newImages[newIndex] = temp;
      return { ...prev, images: newImages };
    });
  };

  const addVariant = () => {
    setFormData(prev => ({
      ...prev,
      variants: [
        ...prev.variants,
        {
          sku: '',
          stock: 0,
          priceOverride: 0,
          attributes: [{ name: '', value: '' }]
        }
      ]
    }));
  };

  const removeVariant = (index: number) => {
    setFormData(prev => {
      const newVariants = [...prev.variants];
      newVariants.splice(index, 1);
      return { ...prev, variants: newVariants };
    });
  };

  const updateVariant = (index: number, field: string, value: any) => {
    setFormData(prev => {
      const newVariants = [...prev.variants];
      newVariants[index] = { ...newVariants[index], [field]: value };
      return { ...prev, variants: newVariants };
    });
  };

  const addVariantAttribute = (variantIndex: number) => {
    setFormData(prev => {
      const newVariants = [...prev.variants];
      newVariants[variantIndex].attributes = [
        ...(newVariants[variantIndex].attributes || []),
        { name: '', value: '' }
      ];
      return { ...prev, variants: newVariants };
    });
  };

  const updateVariantAttribute = (variantIndex: number, attrIndex: number, field: 'name' | 'value', value: string) => {
    setFormData(prev => {
      const newVariants = [...prev.variants];
      const attributes = [...(newVariants[variantIndex].attributes || [])];
      attributes[attrIndex] = { ...attributes[attrIndex], [field]: value };
      newVariants[variantIndex].attributes = attributes;
      return { ...prev, variants: newVariants };
    });
  };

  const removeVariantAttribute = (variantIndex: number, attrIndex: number) => {
    setFormData(prev => {
      const newVariants = [...prev.variants];
      const attributes = [...(newVariants[variantIndex].attributes || [])];
      attributes.splice(attrIndex, 1);
      newVariants[variantIndex].attributes = attributes;
      return { ...prev, variants: newVariants };
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8" aria-label="Product form">
      {/* Basic Info */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
        <h2 className="text-lg font-bold text-gray-900">Basic Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              id="name"
              required
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              aria-required="true"
            />
          </div>
          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">Slug (optional)</label>
            <input
              id="slug"
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData(f => ({ ...f, slug: e.target.value }))}
              placeholder="auto-generated if left blank"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
          <textarea
            id="description"
            required
            rows={4}
            value={formData.description}
            onChange={(e) => setFormData(f => ({ ...f, description: e.target.value }))}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            aria-required="true"
          />
        </div>
        
        <div>
          <label htmlFor="shortDescription" className="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
          <textarea
            id="shortDescription"
            rows={2}
            value={formData.shortDescription}
            onChange={(e) => setFormData(f => ({ ...f, shortDescription: e.target.value }))}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
      </div>

      {/* Images */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <ImageIcon className="h-5 w-5" /> Images
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {formData.images.map((img: any, i: number) => (
            <div key={i} className="relative group rounded-lg overflow-hidden border border-gray-200 aspect-square">
              <img src={img.secure_url} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                <div className="flex justify-between">
                  {i > 0 ? (
                    <button type="button" onClick={() => handleMoveImage(i, -1)} className="p-1 bg-white rounded shadow text-gray-700 hover:text-indigo-600" aria-label="Move image left">
                      <ChevronUp className="h-4 w-4 -rotate-90" />
                    </button>
                  ) : <div />}
                  {i < formData.images.length - 1 ? (
                    <button type="button" onClick={() => handleMoveImage(i, 1)} className="p-1 bg-white rounded shadow text-gray-700 hover:text-indigo-600" aria-label="Move image right">
                      <ChevronDown className="h-4 w-4 -rotate-90" />
                    </button>
                  ) : <div />}
                </div>
                <button type="button" onClick={() => handleRemoveImage(i)} className="p-1 bg-white text-red-600 rounded shadow self-end hover:bg-red-50" aria-label="Remove image">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
          <label className="border-2 border-dashed border-gray-300 rounded-lg aspect-square flex flex-col items-center justify-center text-gray-500 hover:text-indigo-600 hover:border-indigo-300 cursor-pointer transition-colors">
            <Upload className="h-6 w-6 mb-2" />
            <span className="text-sm font-medium">{uploadingImage ? 'Uploading...' : 'Upload Image'}</span>
            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} aria-label="Upload image file" />
          </label>
        </div>
      </div>

      {/* Organization, Pricing & Inventory */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
        <h2 className="text-lg font-bold text-gray-900">Organization, Pricing & Inventory</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
            <select
              id="category"
              required
              value={formData.category}
              onChange={(e) => setFormData(f => ({ ...f, category: e.target.value }))}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              aria-required="true"
            >
              <option value="">Select a category</option>
              {categories?.data?.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
            <input
              id="brand"
              type="text"
              value={formData.brand}
              onChange={(e) => setFormData(f => ({ ...f, brand: e.target.value }))}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">Base Price *</label>
            <input
              id="price"
              required
              type="number"
              min="0"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData(f => ({ ...f, price: parseFloat(e.target.value) }))}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              aria-required="true"
            />
          </div>
          <div>
            <label htmlFor="compareAtPrice" className="block text-sm font-medium text-gray-700 mb-1">Compare-at Price</label>
            <input
              id="compareAtPrice"
              type="number"
              min="0"
              step="0.01"
              value={formData.compareAtPrice}
              onChange={(e) => setFormData(f => ({ ...f, compareAtPrice: parseFloat(e.target.value) }))}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="lowStockThreshold" className="block text-sm font-medium text-gray-700 mb-1">Low Stock Threshold</label>
            <input
              id="lowStockThreshold"
              type="number"
              min="0"
              value={formData.lowStockThreshold}
              onChange={(e) => setFormData(f => ({ ...f, lowStockThreshold: parseInt(e.target.value) }))}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
            <input
              id="tags"
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData(f => ({ ...f, tags: e.target.value }))}
              placeholder="e.g. summer, beach, casual"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
        </div>
      </div>

      {/* SEO & Search */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
        <h2 className="text-lg font-bold text-gray-900">SEO & Search</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="metaTitle" className="block text-sm font-medium text-gray-700 mb-1">Meta Title</label>
            <input
              id="metaTitle"
              type="text"
              value={formData.metaTitle}
              onChange={(e) => setFormData(f => ({ ...f, metaTitle: e.target.value }))}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="metaDescription" className="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
            <textarea
              id="metaDescription"
              rows={3}
              value={formData.metaDescription}
              onChange={(e) => setFormData(f => ({ ...f, metaDescription: e.target.value }))}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
        </div>
      </div>

      {/* Variants & Inventory */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Variants & Stock</h2>
          <button
            type="button"
            onClick={addVariant}
            className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
            aria-label="Add variant"
          >
            <Plus className="h-4 w-4" /> Add Variant
          </button>
        </div>

        {formData.variants.length === 0 ? (
          <div className="text-sm text-gray-500 italic p-4 bg-gray-50 rounded-lg text-center" role="alert">
            No variants created. You must create at least one variant to set inventory stock and SKU.
          </div>
        ) : (
          <div className="space-y-4">
            {formData.variants.map((variant: any, vIndex: number) => (
              <div key={vIndex} className="p-4 border border-gray-200 rounded-lg bg-gray-50/50 relative">
                <button
                  type="button"
                  onClick={() => removeVariant(vIndex)}
                  className="absolute top-4 right-4 text-red-500 hover:bg-red-50 p-1 rounded transition-colors"
                  aria-label="Remove variant"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 pr-10">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">SKU *</label>
                    <input
                      required
                      type="text"
                      value={variant.sku}
                      onChange={(e) => updateVariant(vIndex, 'sku', e.target.value)}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-1.5 px-2"
                      aria-label={`SKU for variant ${vIndex + 1}`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Stock Amount *</label>
                    <input
                      required
                      type="number"
                      min="0"
                      value={variant.stock}
                      onChange={(e) => updateVariant(vIndex, 'stock', parseInt(e.target.value) || 0)}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-1.5 px-2"
                      aria-label={`Stock for variant ${vIndex + 1}`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Price Override ($)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={variant.priceOverride || ''}
                      onChange={(e) => updateVariant(vIndex, 'priceOverride', e.target.value ? parseFloat(e.target.value) : undefined)}
                      placeholder="Optional"
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-1.5 px-2"
                      aria-label={`Price override for variant ${vIndex + 1}`}
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-semibold text-gray-600 uppercase">Attributes</label>
                    <button
                      type="button"
                      onClick={() => addVariantAttribute(vIndex)}
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center"
                      aria-label="Add attribute pair"
                    >
                      <Plus className="h-3 w-3 mr-1" /> Add pair
                    </button>
                  </div>
                  {(!variant.attributes || variant.attributes.length === 0) && (
                    <div className="text-xs text-gray-400 italic mb-2">No attributes (e.g. Size=XL). Base product variant.</div>
                  )}
                  {variant.attributes?.map((attr: any, aIndex: number) => (
                    <div key={aIndex} className="flex gap-2 mb-2 items-center">
                      <input
                        type="text"
                        placeholder="Name (e.g. Size)"
                        value={attr.name}
                        onChange={(e) => updateVariantAttribute(vIndex, aIndex, 'name', e.target.value)}
                        className="w-1/3 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-xs py-1 px-2"
                        aria-label={`Attribute name ${aIndex + 1} for variant ${vIndex + 1}`}
                      />
                      <span className="text-gray-400">=</span>
                      <input
                        type="text"
                        placeholder="Value (e.g. XL)"
                        value={attr.value}
                        onChange={(e) => updateVariantAttribute(vIndex, aIndex, 'value', e.target.value)}
                        className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-xs py-1 px-2"
                        aria-label={`Attribute value ${aIndex + 1} for variant ${vIndex + 1}`}
                      />
                      <button
                        type="button"
                        onClick={() => removeVariantAttribute(vIndex, aIndex)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        aria-label="Remove attribute pair"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Visibility */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex gap-6 items-center">
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            id="status"
            value={formData.status}
            onChange={(e) => setFormData(f => ({ ...f, status: e.target.value }))}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <div className="flex items-center pt-5">
          <input
            id="isFeatured"
            type="checkbox"
            checked={formData.isFeatured}
            onChange={(e) => setFormData(f => ({ ...f, isFeatured: e.target.checked }))}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            aria-label="Mark product as featured"
          />
          <label htmlFor="isFeatured" className="ml-2 block text-sm text-gray-900">Featured Product</label>
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={() => navigate('/admin/products')}
          className="px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-md font-medium hover:bg-gray-50 flex items-center gap-2"
        >
          <X className="h-4 w-4" /> Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading || uploadingImage}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Save className="h-4 w-4" />
          {isLoading ? 'Saving...' : 'Save Product'}
        </button>
      </div>
    </form>
  );
};

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface Material {
  id: string;
  title: string;
  content: string;
  type: 'pdf' | 'image' | 'text';
  status: 'processing' | 'ready' | 'error';
  created_at: string;
  user_id: string;
  processed_content?: string;
  topics?: string[];
  error_message?: string;
}

export function useMaterials() {
  const { user } = useAuth();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadMaterials();
    }
  }, [user]);

  const loadMaterials = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setMaterials(data || []);
    } catch (err) {
      console.error('Error loading materials:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addMaterial = async (material: Omit<Material, 'id' | 'created_at' | 'user_id'>) => {
    try {
      const { data, error } = await supabase
        .from('materials')
        .insert([{
          ...material,
          user_id: user?.id,
        }])
        .select()
        .single();

      if (error) throw error;

      setMaterials(prev => [data, ...prev]);
      return data;
    } catch (err) {
      console.error('Error adding material:', err);
      throw err;
    }
  };

  const updateMaterial = async (id: string, updates: Partial<Material>) => {
    try {
      const { data, error } = await supabase
        .from('materials')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user?.id)
        .select()
        .single();

      if (error) throw error;

      setMaterials(prev => 
        prev.map(m => m.id === id ? { ...m, ...data } : m)
      );
      return data;
    } catch (err) {
      console.error('Error updating material:', err);
      throw err;
    }
  };

  const deleteMaterial = async (id: string) => {
    try {
      const { error } = await supabase
        .from('materials')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;

      setMaterials(prev => prev.filter(m => m.id !== id));
    } catch (err) {
      console.error('Error deleting material:', err);
      throw err;
    }
  };

  const getMaterial = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .eq('id', id)
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;

      return data;
    } catch (err) {
      console.error('Error getting material:', err);
      throw err;
    }
  };

  return {
    materials,
    loading,
    error,
    loadMaterials,
    addMaterial,
    updateMaterial,
    deleteMaterial,
    getMaterial,
  };
}

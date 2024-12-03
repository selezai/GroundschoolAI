"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useMaterials = useMaterials;
const react_1 = require("react");
const supabase_1 = require("../lib/supabase");
const AuthContext_1 = require("../contexts/AuthContext");
function useMaterials() {
    const { user } = (0, AuthContext_1.useAuth)();
    const [materials, setMaterials] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        if (user) {
            loadMaterials();
        }
    }, [user]);
    const loadMaterials = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase_1.supabase
                .from('materials')
                .select('*')
                .eq('user_id', user?.id)
                .order('created_at', { ascending: false });
            if (error)
                throw error;
            setMaterials(data || []);
        }
        catch (err) {
            console.error('Error loading materials:', err);
            setError(err.message);
        }
        finally {
            setLoading(false);
        }
    };
    const addMaterial = async (material) => {
        try {
            const { data, error } = await supabase_1.supabase
                .from('materials')
                .insert([{
                    ...material,
                    user_id: user?.id,
                }])
                .select()
                .single();
            if (error)
                throw error;
            setMaterials(prev => [data, ...prev]);
            return data;
        }
        catch (err) {
            console.error('Error adding material:', err);
            throw err;
        }
    };
    const updateMaterial = async (id, updates) => {
        try {
            const { data, error } = await supabase_1.supabase
                .from('materials')
                .update(updates)
                .eq('id', id)
                .eq('user_id', user?.id)
                .select()
                .single();
            if (error)
                throw error;
            setMaterials(prev => prev.map(m => m.id === id ? { ...m, ...data } : m));
            return data;
        }
        catch (err) {
            console.error('Error updating material:', err);
            throw err;
        }
    };
    const deleteMaterial = async (id) => {
        try {
            const { error } = await supabase_1.supabase
                .from('materials')
                .delete()
                .eq('id', id)
                .eq('user_id', user?.id);
            if (error)
                throw error;
            setMaterials(prev => prev.filter(m => m.id !== id));
        }
        catch (err) {
            console.error('Error deleting material:', err);
            throw err;
        }
    };
    const getMaterial = async (id) => {
        try {
            const { data, error } = await supabase_1.supabase
                .from('materials')
                .select('*')
                .eq('id', id)
                .eq('user_id', user?.id)
                .single();
            if (error)
                throw error;
            return data;
        }
        catch (err) {
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

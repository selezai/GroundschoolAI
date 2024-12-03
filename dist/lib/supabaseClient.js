"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabase = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const _env_1 = require("@env");
if (!_env_1.SUPABASE_URL || !_env_1.SUPABASE_ANON_KEY) {
    throw new Error('Missing Supabase environment variables');
}
exports.supabase = (0, supabase_js_1.createClient)(_env_1.SUPABASE_URL, _env_1.SUPABASE_ANON_KEY);

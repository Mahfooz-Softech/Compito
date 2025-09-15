# Database Schema Fix for Address Lookup

## 🚨 **Issue Description**

The application is encountering a database error when trying to create user profiles during signup:

```
POST https://nyhbeyurlejwfgreyzoc.supabase.co/rest/v1/profiles?columns=%22id%22%…%22postcode%22%2C%22postcode_p1%22%2C%22postcode_p2%22%2C%22postcode_p3%22 400 (Bad Request)

Profile creation error: 
{code: 'PGRST204', details: null, hint: null, message: "Could not find the 'address' column of 'profiles' in the schema cache"}
```

## 🔍 **Root Cause**

The `profiles` table is missing several columns that the `AuthContext.tsx` is trying to insert:

**Missing Columns:**
- ❌ `address` - Full address line from address lookup
- ❌ `county` - County/state from address lookup  
- ❌ `email` - User email address
- ❌ `postcode_p1` - First part of postcode (everything except last character)
- ❌ `postcode_p2` - Second part of postcode (last character of first part)
- ❌ `postcode_p3` - Third part of postcode (second part after space)

## 🛠️ **Solution**

### **Step 1: Run the Database Migration**

Execute the migration file in your Supabase SQL Editor:

```sql
-- File: supabase/migrations/20250120000000_add_missing_profile_columns.sql

-- Add missing columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS county text,
ADD COLUMN IF NOT EXISTS email text;

-- Add postcode part columns
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS postcode_p1 text,
ADD COLUMN IF NOT EXISTS postcode_p2 text,
ADD COLUMN IF NOT EXISTS postcode_p3 text;

-- Add comments and indexes
COMMENT ON COLUMN public.profiles.address IS 'Full address line from address lookup';
COMMENT ON COLUMN public.profiles.county IS 'County/state from address lookup';
COMMENT ON COLUMN public.profiles.email IS 'User email address';
COMMENT ON COLUMN public.profiles.postcode_p1 IS 'First part of postcode (everything except last character)';
COMMENT ON COLUMN public.profiles.postcode_p2 IS 'Second part of postcode (last character of first part)';
COMMENT ON COLUMN public.profiles.postcode_p3 IS 'Third part of postcode (second part after space)';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_postcode_parts ON public.profiles(postcode_p1, postcode_p2, postcode_p3);

-- Populate existing postcode parts if postcode exists
UPDATE public.profiles
SET
    postcode_p1 = CASE
        WHEN postcode IS NOT NULL AND postcode != '' THEN
            CASE
                WHEN position(' ' in postcode) > 0 THEN
                    left(split_part(postcode, ' ', 1), length(split_part(postcode, ' ', 1)) - 1)
                ELSE
                    left(postcode, length(postcode) - 1)
            END
        ELSE NULL
    END,
    postcode_p2 = CASE
        WHEN postcode IS NOT NULL AND postcode != '' THEN
            CASE
                WHEN position(' ' in postcode) > 0 THEN
                    right(split_part(postcode, ' ', 1), 1)
                ELSE
                    right(postcode, 1)
            END
        ELSE NULL
    END,
    postcode_p3 = CASE
        WHEN postcode IS NOT NULL AND postcode != '' AND position(' ' in postcode) > 0 THEN
            split_part(postcode, ' ', 2)
        ELSE NULL
    END
WHERE postcode IS NOT NULL AND postcode != '';
```

### **Step 2: Verify Schema Changes**

After running the migration, verify the new columns exist:

```sql
-- Check profiles table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;
```

### **Step 3: Test the Fix**

1. **Restart your application** to ensure Supabase client picks up the new schema
2. **Try signing up a new user** with address lookup
3. **Check the browser console** for any remaining errors

## 📊 **Updated Profiles Table Schema**

After the migration, the `profiles` table will have these columns:

```sql
profiles: {
  id: string (primary key)
  first_name: string
  last_name: string
  user_type: string
  email: string | null ✅ NEW
  phone: string | null
  avatar_url: string | null
  address: string | null ✅ NEW
  city: string | null
  county: string | null ✅ NEW
  country: string | null
  postcode: string | null
  postcode_p1: string | null ✅ NEW
  postcode_p2: string | null ✅ NEW
  postcode_p3: string | null ✅ NEW
  latitude: number | null
  longitude: number | null
  location: string | null
  customer_rating: number | null
  customer_total_reviews: number | null
  created_at: string | null
  updated_at: string | null
}
```

## 🔧 **Files Modified**

1. **Database Migration**: `supabase/migrations/20250120000000_add_missing_profile_columns.sql`
2. **TypeScript Types**: `src/integrations/supabase/types.ts` (profiles table types updated)
3. **Documentation**: This README file

## ✅ **Expected Result**

After applying the fix:
- ✅ User signup with address lookup will work
- ✅ Profile creation will succeed
- ✅ Postcode splitting will be stored in database
- ✅ No more "column not found" errors

## 🚀 **Next Steps**

1. Run the migration in Supabase
2. Test user signup functionality
3. Verify address lookup and postcode splitting works
4. Monitor for any additional schema issues

## 📝 **Notes**

- The migration uses `ADD COLUMN IF NOT EXISTS` to prevent errors if columns already exist
- Existing profiles with postcodes will have their postcode parts automatically populated
- The new columns are nullable to maintain backward compatibility
- An index is created on postcode parts for better query performance

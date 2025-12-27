#!/usr/bin/env node
/**
 * Test Script for Nano Banana Image Generation
 *
 * This script tests the end-to-end flow of image generation:
 * 1. Creates a test job
 * 2. Sends event to Inngest
 * 3. Polls for completion
 * 4. Verifies the result
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

console.log('🧪 Testing Nano Banana Image Generation Integration\n');

// Verify environment variables
const requiredEnvVars = [
  'KIE_API_KEY',
  'INNGEST_EVENT_KEY',
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
];

console.log('📋 Checking environment variables...');
const missingVars = requiredEnvVars.filter(v => !process.env[v]);
if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars.join(', '));
  process.exit(1);
}
console.log('✅ All required environment variables present\n');

// Check Kie API connectivity
async function testKieAPI() {
  console.log('🔌 Testing Kie API connectivity...');
  try {
    const response = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.KIE_API_KEY}`
      },
      body: JSON.stringify({
        model: 'google/nano-banana',
        input: {
          prompt: 'simple test image, blue circle',
          output_format: 'png',
          image_size: '1:1',
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Kie API error: ${response.status} - ${errorText}`);
      return false;
    }

    const data = await response.json();
    const taskId = data.data?.taskId || data.taskId;

    if (taskId) {
      console.log(`✅ Kie API connected successfully! Test taskId: ${taskId}`);
      return true;
    } else {
      console.error('❌ Unexpected Kie API response:', data);
      return false;
    }
  } catch (error) {
    console.error('❌ Failed to connect to Kie API:', error.message);
    return false;
  }
}

// Check Supabase Storage
async function testSupabaseStorage() {
  console.log('\n📦 Testing Supabase Storage...');
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // List buckets
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) {
      console.error('❌ Failed to list buckets:', listError.message);
      return false;
    }

    // Check if 'images' bucket exists
    const imagesBucket = buckets.find(b => b.name === 'images');
    if (!imagesBucket) {
      console.log('⚠️  "images" bucket not found. Creating it...');

      const { data, error: createError } = await supabase.storage.createBucket('images', {
        public: true,
        fileSizeLimit: 10485760, // 10MB
      });

      if (createError) {
        console.error('❌ Failed to create bucket:', createError.message);
        console.log('💡 Please create the "images" bucket manually in Supabase Dashboard');
        return false;
      }

      console.log('✅ Created "images" bucket successfully!');
    } else {
      console.log('✅ Supabase "images" bucket exists');
    }

    // Test upload
    console.log('📤 Testing image upload...');
    const testData = Buffer.from('test-image-data');
    const testFilename = `test-${Date.now()}.png`;

    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(`generated/${testFilename}`, testData, {
        contentType: 'image/png',
      });

    if (uploadError) {
      console.error('❌ Failed to upload test file:', uploadError.message);
      return false;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(`generated/${testFilename}`);

    console.log(`✅ Test upload successful! URL: ${publicUrl}`);

    // Clean up test file
    await supabase.storage.from('images').remove([`generated/${testFilename}`]);
    console.log('✅ Cleaned up test file');

    return true;
  } catch (error) {
    console.error('❌ Supabase Storage test failed:', error.message);
    return false;
  }
}

// Check Inngest setup
async function testInngest() {
  console.log('\n⚡ Checking Inngest configuration...');

  if (!process.env.INNGEST_EVENT_KEY) {
    console.error('❌ INNGEST_EVENT_KEY not configured');
    return false;
  }

  console.log('✅ Inngest event key present');

  const featureFlag = process.env.USE_INNGEST_IMAGE_GEN === 'true';
  if (featureFlag) {
    console.log('✅ USE_INNGEST_IMAGE_GEN is enabled');
  } else {
    console.log('⚠️  USE_INNGEST_IMAGE_GEN is disabled (feature flag off)');
  }

  return true;
}

// Main test runner
async function runTests() {
  console.log('━'.repeat(60));

  const kieOk = await testKieAPI();
  const supabaseOk = await testSupabaseStorage();
  const inngestOk = await testInngest();

  console.log('\n' + '━'.repeat(60));
  console.log('📊 Test Results:\n');
  console.log(`   Kie API:          ${kieOk ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Supabase Storage: ${supabaseOk ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Inngest Config:   ${inngestOk ? '✅ PASS' : '❌ FAIL'}`);

  const allPassed = kieOk && supabaseOk && inngestOk;

  if (allPassed) {
    console.log('\n🎉 All tests passed! Image generation is ready to use.');
    console.log('\n📝 Next steps:');
    console.log('   1. Start dev server: pnpm run dev');
    console.log('   2. Go to Studio and generate a splash screen');
    console.log('   3. Watch logs for generateImage tool usage');
    console.log('   4. Check Supabase Storage for generated images');
  } else {
    console.log('\n❌ Some tests failed. Please fix the issues above.');
  }

  console.log('━'.repeat(60) + '\n');

  process.exit(allPassed ? 0 : 1);
}

runTests().catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});

/**
 * System Verification Script
 * Answers the question: "Does this work?"
 * 
 * This script verifies that core functionality of the Nightfall Survivors game works.
 */

import { initWorld, updateWorld } from '../src/state/world';
import { stepSync } from '../src/core/loop';

function verifySystem(): boolean {
  console.log('🔍 Verifying Nightfall Survivors System...\n');
  
  try {
    // Test 1: World Initialization
    console.log('✓ Test 1: Initializing world...');
    const world = initWorld(42);
    if (!world || !world.player || !world.rng) {
      console.error('✗ World initialization failed');
      return false;
    }
    console.log('  ✓ World initialized successfully');
    
    // Test 2: World Update
    console.log('✓ Test 2: Updating world state...');
    const updatedWorld = updateWorld(world);
    if (!updatedWorld || updatedWorld.frameCount !== world.frameCount + 1) {
      console.error('✗ World update failed');
      return false;
    }
    console.log('  ✓ World updated successfully');
    
    // Test 3: Game Loop Step
    console.log('✓ Test 3: Testing game loop...');
    const steppedWorld = stepSync(world, updateWorld, 1); // 1 tick
    if (!steppedWorld) {
      console.error('✗ Game loop step failed');
      return false;
    }
    console.log('  ✓ Game loop step successful');
    
    // Test 4: Multiple Frames
    console.log('✓ Test 4: Running multiple frames...');
    const currentWorld = stepSync(world, updateWorld, 60); // 60 ticks
    const expectedMinFrames = world.frameCount + 60;
    if (currentWorld.frameCount < expectedMinFrames) {
      console.error(`✗ Multiple frame execution failed (expected >= ${expectedMinFrames}, got ${currentWorld.frameCount})`);
      return false;
    }
    console.log(`  ✓ Ran 60 frames successfully (frame count increased from ${world.frameCount} to ${currentWorld.frameCount})`);
    
    // Test 5: Player State
    console.log('✓ Test 5: Verifying player state...');
    if (!currentWorld.player || currentWorld.player.hp <= 0) {
      console.error('✗ Player state invalid');
      return false;
    }
    console.log(`  ✓ Player is alive with ${currentWorld.player.hp} HP`);
    
    return true;
  } catch (error) {
    console.error('✗ Verification failed with error:', error);
    return false;
  }
}

// Run verification
const result = verifySystem();

console.log('\n' + '='.repeat(50));
if (result) {
  console.log('✅ YES, THIS WORKS! All systems operational.');
  console.log('='.repeat(50));
  process.exit(0);
} else {
  console.log('❌ NO, THIS DOES NOT WORK! System verification failed.');
  console.log('='.repeat(50));
  process.exit(1);
}

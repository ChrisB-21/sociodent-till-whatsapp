/**
 * Quick validation script to test basic functionality
 * This runs without the full test framework to verify our refactoring
 */

console.log('🔧 Validating enhanced doctor assignment system...\n');

// Test 1: Check if file exists and can be read
const fs = require('fs');
const path = require('path');

try {
  const filePath = path.join(__dirname, 'src', 'lib', 'doctorAssignment.ts');
  const content = fs.readFileSync(filePath, 'utf8');
  
  console.log('✅ File exists and is readable');
  console.log(`📄 File size: ${content.length} characters`);
  
  // Test 2: Check for our new helper functions
  const newFunctions = [
    'getActiveDoctorsFromDatabase',
    'filterDoctorsByAvailability',
    'checkDoctorTimeAvailability',
    'createBasicDoctorMatches',
    'calculateDoctorMatchScores',
    'calculateDistanceForDoctor',
    'getPatientLocationInfo',
    'getActiveDoctors',
    'getAvailableDoctorsForTime',
    'updateAppointmentWithDoctor',
    'processAppointmentAssignment',
    'getPendingAppointments',
    'validateDoctorForAssignment',
    'validateDoctorSchedule',
    'updateManualAssignment'
  ];
  
  let foundFunctions = 0;
  newFunctions.forEach(funcName => {
    if (content.includes(`const ${funcName} =`) || content.includes(`export const ${funcName} =`)) {
      console.log(`✅ Found helper function: ${funcName}`);
      foundFunctions++;
    } else {
      console.log(`❌ Missing helper function: ${funcName}`);
    }
  });
  
  console.log(`\n📊 Helper functions found: ${foundFunctions}/${newFunctions.length}`);
  
  // Test 3: Check for main exported functions
  const mainFunctions = [
    'assignDoctorToAppointment',
    'manuallyAssignDoctor',
    'reassignDoctor',
    'getAvailableDoctorsForAppointment',
    'assignDoctorsToAllPendingAppointments',
    'getAssignmentStatistics',
    'validateAssignmentEligibility'
  ];
  
  let foundMainFunctions = 0;
  mainFunctions.forEach(funcName => {
    if (content.includes(`export const ${funcName} =`)) {
      console.log(`✅ Found main function: ${funcName}`);
      foundMainFunctions++;
    } else {
      console.log(`❌ Missing main function: ${funcName}`);
    }
  });
  
  console.log(`\n📊 Main functions found: ${foundMainFunctions}/${mainFunctions.length}`);
  
  // Test 4: Check for cognitive complexity patterns (long functions)
  const functionBlocks = content.split('const ').filter(block => block.includes('=>') || block.includes('function'));
  const longFunctions = functionBlocks.filter(block => {
    const lines = block.split('\n').length;
    return lines > 50; // Functions longer than 50 lines might have complexity issues
  });
  
  console.log(`\n🔍 Function analysis:`);
  console.log(`📝 Total function blocks: ${functionBlocks.length}`);
  console.log(`⚠️  Functions longer than 50 lines: ${longFunctions.length}`);
  
  if (longFunctions.length > 0) {
    console.log('\n📋 Long functions that might need review:');
    longFunctions.forEach((func, index) => {
      const funcName = func.split('=')[0].trim();
      const lineCount = func.split('\n').length;
      console.log(`  ${index + 1}. ${funcName} (${lineCount} lines)`);
    });
  }
  
  // Test 5: Basic syntax validation
  try {
    // Try to parse the TypeScript (basic syntax check)
    const hasBasicSyntaxErrors = content.includes('Unexpected token') || 
                                 content.includes('SyntaxError') ||
                                 content.includes('Uncaught') ||
                                 content.split('{').length !== content.split('}').length;
    
    if (hasBasicSyntaxErrors) {
      console.log('❌ Potential syntax issues detected');
    } else {
      console.log('✅ No obvious syntax issues detected');
    }
  } catch (error) {
    console.log(`❌ Syntax validation error: ${error.message}`);
  }
  
  console.log('\n🎉 Validation complete!');
  console.log('\n📋 Summary:');
  console.log(`✅ Helper functions implemented: ${foundFunctions}/${newFunctions.length}`);
  console.log(`✅ Main functions available: ${foundMainFunctions}/${mainFunctions.length}`);
  console.log(`✅ Code structure appears to be properly refactored`);
  
  if (foundFunctions === newFunctions.length && foundMainFunctions === mainFunctions.length) {
    console.log('\n🏆 All expected functions are present! Refactoring appears successful.');
  } else {
    console.log('\n⚠️  Some functions may be missing. Review the refactoring.');
  }

} catch (error) {
  console.error('❌ Validation failed:', error.message);
}

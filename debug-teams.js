const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/standup', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define Team schema for debugging
const teamSchema = new mongoose.Schema({
  name: String,
  description: String,
  adminId: mongoose.Schema.Types.ObjectId,
  members: [mongoose.Schema.Types.ObjectId],
  pendingInvites: [String],
  standupTime: String,
  timezone: String,
  reminderMinutes: Number,
  punctualityGoal: Number,
  engagementGoal: Number,
  onboardingStep: Number,
  onboardingCompleted: Boolean,
  createdAt: Date,
  updatedAt: Date
});

const Team = mongoose.model('Team', teamSchema);

async function debugTeams() {
  try {
    console.log('🔍 Debugging Teams Database...\n');

    // Get all teams
    const allTeams = await Team.find({});
    console.log(`📊 Total teams in database: ${allTeams.length}`);

    if (allTeams.length > 0) {
      console.log('\n📋 All Teams:');
      allTeams.forEach((team, index) => {
        console.log(`\n${index + 1}. Team ID: ${team._id}`);
        console.log(`   Name: ${team.name}`);
        console.log(`   Admin ID: ${team.adminId}`);
        console.log(`   Onboarding Step: ${team.onboardingStep}`);
        console.log(`   Onboarding Completed: ${team.onboardingCompleted}`);
        console.log(`   Created: ${team.createdAt}`);
      });
    }

    // Check for teams with specific admin ID (replace with your user ID)
    const userId = '68899f5bda493b5cc1190a'; // Your user ID from JWT
    console.log(`\n🔍 Looking for teams with admin ID: ${userId}`);
    
    const userTeams = await Team.find({ adminId: userId });
    console.log(`Found ${userTeams.length} teams for this user`);

    if (userTeams.length > 0) {
      userTeams.forEach((team, index) => {
        console.log(`\n${index + 1}. Team ID: ${team._id}`);
        console.log(`   Name: ${team.name}`);
        console.log(`   Onboarding Step: ${team.onboardingStep}`);
        console.log(`   Onboarding Completed: ${team.onboardingCompleted}`);
        console.log(`   Created: ${team.createdAt}`);
      });
    }

    // Check for incomplete onboarding teams
    const incompleteTeams = await Team.find({ onboardingCompleted: false });
    console.log(`\n📝 Teams with incomplete onboarding: ${incompleteTeams.length}`);

    if (incompleteTeams.length > 0) {
      incompleteTeams.forEach((team, index) => {
        console.log(`\n${index + 1}. Team ID: ${team._id}`);
        console.log(`   Name: ${team.name}`);
        console.log(`   Admin ID: ${team.adminId}`);
        console.log(`   Onboarding Step: ${team.onboardingStep}`);
      });
    }

    // Check for duplicate team names
    const teamNames = allTeams.map(team => team.name);
    const uniqueNames = [...new Set(teamNames)];
    console.log(`\n📝 Unique team names: ${uniqueNames.length} out of ${teamNames.length} total`);

    if (teamNames.length !== uniqueNames.length) {
      console.log('⚠️  Duplicate team names found!');
      const duplicates = teamNames.filter((name, index) => teamNames.indexOf(name) !== index);
      console.log('Duplicate names:', [...new Set(duplicates)]);
    }

  } catch (error) {
    console.error('❌ Error debugging teams:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Database connection closed');
  }
}

debugTeams(); 
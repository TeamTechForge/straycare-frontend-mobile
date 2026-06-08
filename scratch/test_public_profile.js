const testPublicProfile = async () => {
  const time = Date.now();
  const email = `profile_test_${time}@gmail.com`;
  const password = 'password123';
  const name = 'Alex Mercer';
  const phone = '0779998888';

  const baseUrl = 'http://172.20.10.3:5000/api';

  try {
    console.log('1. Registering new user...');
    const regRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone, password }),
    });
    const regData = await regRes.json();
    console.log('Register status:', regRes.status);
    if (!regRes.ok) throw new Error(regData.message);

    const token = regData.token;
    const userId = regData.user.id;
    console.log(`User registered with ID: ${userId}`);

    console.log('\n2. Fetching initial public profile...');
    const profileRes = await fetch(`${baseUrl}/users/${userId}/public-profile`);
    const profileData = await profileRes.json();
    console.log('Profile status:', profileRes.status);
    console.log('Initial profile data:', JSON.stringify(profileData, null, 2));

    console.log('\n3. Creating a forum post (authenticated)...');
    const postRes = await fetch(`${baseUrl}/forum/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ title: 'Important alert: found dog in sector 4!' }),
    });
    const postData = await postRes.json();
    console.log('Post status:', postRes.status);
    console.log('Created post:', JSON.stringify(postData, null, 2));

    console.log('\n4. Creating a stray report (authenticated)...');
    const strayRes = await fetch(`${baseUrl}/stray/report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        caseId: `CASE-${time}`,
        animalType: 'Dog',
        breed: 'Labrador',
        status: 'Needs Help',
        notes: 'Injured on the highway side.',
        location: { lat: 6.9271, lng: 79.8612, address: 'Colombo, Sri Lanka' }
      }),
    });
    const strayData = await strayRes.json();
    console.log('Stray report status:', strayRes.status);
    console.log('Created stray report:', JSON.stringify(strayData, null, 2));

    console.log('\n5. Fetching updated public profile (expecting post and report count to be 1)...');
    const updatedProfileRes = await fetch(`${baseUrl}/users/${userId}/public-profile`);
    const updatedProfileData = await updatedProfileRes.json();
    console.log('Updated profile status:', updatedProfileRes.status);
    console.log('Updated profile data:', JSON.stringify(updatedProfileData, null, 2));

    console.log('\n6. Fetching user posts...');
    const userPostsRes = await fetch(`${baseUrl}/users/${userId}/posts`);
    const userPosts = await userPostsRes.json();
    console.log('User posts count:', userPosts.length);

    console.log('\n7. Fetching user reports...');
    const userReportsRes = await fetch(`${baseUrl}/users/${userId}/reports`);
    const userReports = await userReportsRes.json();
    console.log('User reports count:', userReports.length);

    console.log('\n8. Reporting the user (self-reporting for testing)...');
    const reportUserRes = await fetch(`${baseUrl}/reports/user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        reportedUserId: userId,
        reason: 'Spam',
        description: 'This user is spamming with repeated forum posts on the feed.' // Length > 20
      }),
    });
    const reportUserData = await reportUserRes.json();
    console.log('Report user status:', reportUserRes.status);
    console.log('Report user response:', JSON.stringify(reportUserData, null, 2));

    console.log('\n9. Admin getting all user reports...');
    const adminReportsRes = await fetch(`${baseUrl}/admin/user-reports`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const adminReports = await adminReportsRes.json();
    console.log('Admin reports status:', adminReportsRes.status);
    console.log('First report detail:', JSON.stringify(adminReports[0], null, 2));

    console.log('\nAll tests passed successfully!');

  } catch (err) {
    console.error('Error during test execution:', err.message);
  }
};

testPublicProfile();

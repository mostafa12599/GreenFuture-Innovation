exports.logActivity = async (userId, activity) => {
    const newActivity = await Activity.create({
      user: userId,
      ...activity
    });
  
    await User.findByIdAndUpdate(userId, {
      $push: { activities: {
        action: activity.action,
        timestamp: new Date(),
        metadata: activity.metadata
      }}
    });
  
    return newActivity;
  };
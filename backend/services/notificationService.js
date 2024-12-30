exports.sendNotification = async (userId, notification) => {
    const newNotification = await Notification.create({
      user: userId,
      ...notification
    });
    return newNotification;
  };
  
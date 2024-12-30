const Idea = require('../models/Idea');
const Activity = require('../models/Activity');

const calculateImplementationRate = (ideas) => {
 const implemented = ideas.filter(idea => idea.status === 'implemented').length;
 return ideas.length > 0 ? (implemented / ideas.length) * 100 : 0;
};

const getIdeasByStatus = (ideas) => {
 return ideas.reduce((acc, idea) => {
   acc[idea.status] = (acc[idea.status] || 0) + 1;
   return acc;
 }, {});
};

const getIdeasByDepartment = (ideas) => {
    const departmentStats = ideas.reduce((acc, idea) => {
      acc[idea.department] = (acc[idea.department] || 0) + 1;
      return acc;
    }, {});
   
    return Object.entries(departmentStats).map(([name, value]) => ({
      name,
      value
    }));
   };

const generateInsights = (ideas) => {
 const topDepartments = Object.entries(getIdeasByDepartment(ideas))
   .sort(([,a], [,b]) => b - a)
   .slice(0, 3);

 return [
   `Top performing department: ${topDepartments[0]?.[0] || 'None'}`,
   `Implementation rate: ${calculateImplementationRate(ideas).toFixed(1)}%`,
   `Total ideas submitted: ${ideas.length}`
 ];
};

exports.getDashboardData = async (req, res) => {
 try {
   const [ideas, activities] = await Promise.all([
     Idea.find().populate('submittedBy', 'name department'),
     Activity.find()
       .populate('user', 'name')
       .sort('-createdAt')
       .limit(10)
   ]);

   const statistics = {
     totalIdeas: ideas.length,
     implementationRate: calculateImplementationRate(ideas),
     ideasByStatus: getIdeasByStatus(ideas),
     ideasByDepartment: getIdeasByDepartment(ideas),
     insights: generateInsights(ideas)
   };

   res.json({
     statistics,
     recentIdeas: ideas.slice(0, 5),
     userActivities: activities
   });
 } catch (error) {
   res.status(500).json({ message: error.message });
 }
};

exports.getDepartmentStats = async (req, res) => {
    try {
      const stats = await Idea.aggregate([
        {
          $group: {
            _id: '$department',
            totalIdeas: { $sum: 1 },
            implementedIdeas: { $sum: { $cond: [{ $eq: ['$status', 'implemented'] }, 1, 0] } }
          }
        }
      ]);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  
  exports.getPerformanceMetrics = async (req, res) => {
    try {
      const metrics = await Promise.all([
        Idea.countDocuments(),
        User.countDocuments(),
        Activity.countDocuments(),
        Training.countDocuments()
      ]);
      
      res.json({
        totalIdeas: metrics[0],
        activeUsers: metrics[1],
        activities: metrics[2],
        trainings: metrics[3]
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
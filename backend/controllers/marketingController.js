exports.updateMarketingCampaign = async (req, res) => {
    try {
      const idea = await Idea.findById(req.params.id);
      if (!idea) {
        return res.status(404).json({ message: 'Idea not found' });
      }
  
      idea.marketingCampaign = {
        ...idea.marketingCampaign,
        ...req.body
      };
      await idea.save();
      res.json(idea);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  };
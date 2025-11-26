const mongoose = require('mongoose');
const { Schema } = mongoose;

const reviewVoteSchema = new Schema({
  review: {
    type: Schema.Types.ObjectId,
    ref: 'Review',
    required: true,
    index: true,
  },

  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  voteType: {
    type: String,
    enum: ['helpful', 'unhelpful'],
    required: true,
  },
}, {
  timestamps: true,
});

// Prevent duplicate votes
reviewVoteSchema.index({ review: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('ReviewVote', reviewVoteSchema);

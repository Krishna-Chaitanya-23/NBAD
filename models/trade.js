const mongoose = require('mongoose');
const watchList = require('./watchList');
const Schema = mongoose.Schema;

const tradeSchema = new Schema(
  {
    name: { type: String, required: [true, 'Title is required'] },
    category: { type: String, required: [true, 'Category is required'] },
    developer: { type: String, required: [true, 'developer is required'] },
    details: {
      type: String,
      required: [true, 'Detail is required'],
      minLength: [10, 'The detail should have at least 10 characters'],
    },
    host: { type: Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, required: [false, 'Status is set internally'] },
    image: { type: String, required: [true, 'Image is required'] },
    tradeWith: {type: Schema.Types.ObjectId, ref: 'Trade'}
  },
  { timestamps: true }
);

tradeSchema.pre('deleteOne', (next) => {
  let id = this.getQuery()['_id'];
  watchList.deleteMany({ trade: id }).exec();
  next();
});

module.exports = mongoose.model('Trade', tradeSchema);

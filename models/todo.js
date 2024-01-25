'use strict';
const {
  Model
} = require('sequelize');
const { Op } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Todo extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Todo.belongsTo(models.User, {
        foreignKey:'userId'
      })

    }
    static addTodo({title, dueDate, userId}){
      return this.create({title:title, dueDate: dueDate, completed: false, userId});
    }
    static async getTodos() {
      try {
        return await this.findAll();
      } catch (error) {
        console.error('Error fetching todos:', error);
        throw error;
      }
    }
    
    static async overDue(userId) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return this.findAll({
        where: {
          userId,
          completed: false,
          dueDate: {
            [Op.lt]: today
          }
        }
      });
    }
    
    static async dueToday(userId) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return this.findAll({
        where: {
          userId,
          completed: false,
          dueDate: {
            [Op.eq]: today
          }
        }
      });
    }
    
    static async dueLater(userId) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return this.findAll({
        where: {
          userId,
          completed: false,
          dueDate: {
            [Op.gt]: today
          }
        }
      });
    }
    
    static async remove(id, userId){
      return this.update({
        completed: false
      }, {
        where: {
          id,
          userId
        }
      });
    }
    
    static async completedItems(userId) {
      return this.findAll({
        where: {
          userId,
          completed: true
        }
      });
    }
    
    markAsCompleted() {
      return this.update({completed: true});
    }
  }
  Todo.init({
    title: DataTypes.STRING,
    dueDate: DataTypes.DATEONLY,
    completed: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'Todo',
  });
  return Todo;
};
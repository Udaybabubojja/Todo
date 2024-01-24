'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Todo extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here

    }
    static addTodo({title, dueDate}){
      return this.create({title:title, dueDate: dueDate, completed: false});
    }
    static async getTodos() {
      try {
        return await this.findAll();
      } catch (error) {
        console.error('Error fetching todos:', error);
        throw error;
      }
    }
    
    static async overDue() {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todos = await this.getTodos();
      return todos.filter((item) =>  new Date(item.dueDate).setHours(0, 0, 0, 0) < today);
    }
    
    static async dueToday() {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to midnight
        const todos = await this.getTodos();
        const dueTodayTodos = todos.filter(
          (item) => {
            const todoDueDate = new Date(item.dueDate);
            todoDueDate.setHours(0, 0, 0, 0); 
            return todoDueDate.toISOString() === today.toISOString();
          }
        );
        return dueTodayTodos;
      } catch (error) {
        throw error;
      }
    }

    static async dueLater() {
      const today = new Date();
      const todos = await this.getTodos();
      return todos.filter((item) => new Date(item.dueDate).setHours(0, 0, 0, 0) > today);
    }

    static async remove(id){
      return this.destroy({
        where:{
          id,
        }
      })
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
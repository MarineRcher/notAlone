'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('groups', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      },
      maxMembers: {
        type: Sequelize.INTEGER,
        defaultValue: 10,
        allowNull: false,
        validate: {
          min: 2,
          max: 50
        }
      },
      currentMembers: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
        validate: {
          min: 0
        }
      },
      isPublic: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Create indexes
    await queryInterface.addIndex('groups', ['isActive', 'isPublic']);
    await queryInterface.addIndex('groups', ['currentMembers', 'maxMembers']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('groups');
  }
}; 
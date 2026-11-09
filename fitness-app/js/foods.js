/*
 * Built-in food database. Values are per 100 g (or 100 ml for drinks), rounded,
 * approximated from USDA FoodData Central. `servings` lists common portions in grams.
 * Users can add their own foods in the app; those are stored separately.
 */
(function (root) {
  'use strict';

  // [id, name, category, kcal, protein, carbs, fat, servings]
  var RAW = [
    // Protein
    ['chicken-breast', 'Chicken breast, cooked', 'Protein', 165, 31, 0, 3.6, [['1 breast', 172], ['palm-size (100 g)', 100]]],
    ['chicken-thigh', 'Chicken thigh, cooked, skinless', 'Protein', 209, 26, 0, 10.9, [['1 thigh', 52]]],
    ['turkey-deli', 'Turkey breast, deli sliced', 'Protein', 104, 17, 4, 2, [['1 slice', 28]]],
    ['beef-85', 'Ground beef 85% lean, cooked', 'Protein', 250, 26, 0, 15, [['1 patty', 113]]],
    ['steak-sirloin', 'Sirloin steak, cooked', 'Protein', 206, 30, 0, 9, [['small steak', 170]]],
    ['pork-tenderloin', 'Pork tenderloin, cooked', 'Protein', 143, 26, 0, 3.5, [['1 portion', 113]]],
    ['bacon', 'Bacon, cooked', 'Protein', 541, 37, 1.4, 42, [['1 slice', 8]]],
    ['salmon', 'Salmon, cooked', 'Protein', 206, 22, 0, 12, [['1 fillet', 154]]],
    ['tuna-can', 'Tuna, canned in water, drained', 'Protein', 116, 26, 0, 0.8, [['1 can', 142]]],
    ['shrimp', 'Shrimp, cooked', 'Protein', 99, 24, 0.2, 0.3, [['10 large', 60]]],
    ['cod', 'Cod, cooked', 'Protein', 105, 23, 0, 0.9, [['1 fillet', 180]]],
    ['egg', 'Egg, whole', 'Protein', 143, 12.6, 0.7, 9.5, [['1 large egg', 50]]],
    ['egg-white', 'Egg white', 'Protein', 52, 11, 0.7, 0.2, [['1 large white', 33]]],
    ['tofu', 'Tofu, firm', 'Protein', 144, 17, 3, 9, [['1/2 block', 200]]],
    ['whey', 'Whey protein powder', 'Protein', 400, 80, 8, 6, [['1 scoop', 30]]],

    // Dairy
    ['greek-yogurt', 'Greek yogurt, plain nonfat', 'Dairy', 59, 10, 3.6, 0.4, [['1 cup', 245], ['1 tub', 170]]],
    ['yogurt-whole', 'Yogurt, plain whole milk', 'Dairy', 61, 3.5, 4.7, 3.3, [['1 cup', 245]]],
    ['milk-2', 'Milk, 2%', 'Dairy', 50, 3.3, 4.8, 2, [['1 cup', 244]]],
    ['milk-skim', 'Milk, skim', 'Dairy', 34, 3.4, 5, 0.1, [['1 cup', 245]]],
    ['cottage-cheese', 'Cottage cheese, 2%', 'Dairy', 84, 11, 4.3, 2.3, [['1/2 cup', 113]]],
    ['cheddar', 'Cheddar cheese', 'Dairy', 403, 25, 1.3, 33, [['1 slice', 28]]],
    ['mozzarella', 'Mozzarella, part-skim', 'Dairy', 254, 24, 2.8, 16, [['1 oz', 28]]],
    ['butter', 'Butter', 'Dairy', 717, 0.9, 0.1, 81, [['1 tbsp', 14]]],

    // Grains & starches
    ['oats', 'Oats, rolled (dry)', 'Grains', 379, 13, 68, 6.5, [['1/2 cup', 40]]],
    ['rice-white', 'White rice, cooked', 'Grains', 130, 2.7, 28, 0.3, [['1 cup', 158]]],
    ['rice-brown', 'Brown rice, cooked', 'Grains', 123, 2.7, 26, 1, [['1 cup', 195]]],
    ['pasta', 'Pasta, cooked', 'Grains', 158, 5.8, 31, 0.9, [['1 cup', 140]]],
    ['quinoa', 'Quinoa, cooked', 'Grains', 120, 4.4, 21, 1.9, [['1 cup', 185]]],
    ['bread-wheat', 'Bread, whole wheat', 'Grains', 252, 12, 43, 3.5, [['1 slice', 32]]],
    ['bread-white', 'Bread, white', 'Grains', 266, 8.9, 49, 3.3, [['1 slice', 28]]],
    ['bagel', 'Bagel, plain', 'Grains', 257, 10, 50, 1.6, [['1 bagel', 105]]],
    ['tortilla', 'Flour tortilla', 'Grains', 306, 8, 50, 8, [['1 medium (8")', 45]]],
    ['granola', 'Granola', 'Grains', 471, 10, 64, 20, [['1/2 cup', 60]]],
    ['potato', 'Potato, baked with skin', 'Grains', 93, 2.5, 21, 0.1, [['1 medium', 173]]],
    ['sweet-potato', 'Sweet potato, baked', 'Grains', 90, 2, 21, 0.2, [['1 medium', 114]]],

    // Legumes, nuts, fats
    ['black-beans', 'Black beans, cooked', 'Legumes & nuts', 132, 8.9, 24, 0.5, [['1/2 cup', 86]]],
    ['lentils', 'Lentils, cooked', 'Legumes & nuts', 116, 9, 20, 0.4, [['1/2 cup', 99]]],
    ['chickpeas', 'Chickpeas, cooked', 'Legumes & nuts', 164, 8.9, 27, 2.6, [['1/2 cup', 82]]],
    ['hummus', 'Hummus', 'Legumes & nuts', 166, 7.9, 14, 9.6, [['2 tbsp', 30]]],
    ['peanut-butter', 'Peanut butter', 'Legumes & nuts', 588, 25, 20, 50, [['2 tbsp', 32]]],
    ['almonds', 'Almonds', 'Legumes & nuts', 579, 21, 22, 50, [['1 oz (~23 nuts)', 28]]],
    ['walnuts', 'Walnuts', 'Legumes & nuts', 654, 15, 14, 65, [['1 oz', 28]]],
    ['olive-oil', 'Olive oil', 'Legumes & nuts', 884, 0, 0, 100, [['1 tbsp', 13.5], ['1 tsp', 4.5]]],
    ['avocado', 'Avocado', 'Legumes & nuts', 160, 2, 8.5, 14.7, [['1 whole', 150], ['1/2', 75]]],

    // Fruit
    ['banana', 'Banana', 'Fruit', 89, 1.1, 23, 0.3, [['1 medium', 118]]],
    ['apple', 'Apple', 'Fruit', 52, 0.3, 14, 0.2, [['1 medium', 182]]],
    ['orange', 'Orange', 'Fruit', 47, 0.9, 12, 0.1, [['1 medium', 131]]],
    ['blueberries', 'Blueberries', 'Fruit', 57, 0.7, 14, 0.3, [['1 cup', 148]]],
    ['strawberries', 'Strawberries', 'Fruit', 32, 0.7, 7.7, 0.3, [['1 cup', 152]]],
    ['grapes', 'Grapes', 'Fruit', 69, 0.7, 18, 0.2, [['1 cup', 151]]],
    ['raisins', 'Raisins', 'Fruit', 299, 3.1, 79, 0.5, [['small box', 43]]],

    // Vegetables
    ['broccoli', 'Broccoli', 'Vegetables', 34, 2.8, 7, 0.4, [['1 cup chopped', 91]]],
    ['spinach', 'Spinach, raw', 'Vegetables', 23, 2.9, 3.6, 0.4, [['1 cup', 30]]],
    ['salad-greens', 'Mixed salad greens', 'Vegetables', 17, 1.4, 3, 0.2, [['2 cups', 85]]],
    ['carrot', 'Carrot', 'Vegetables', 41, 0.9, 10, 0.2, [['1 medium', 61]]],
    ['bell-pepper', 'Bell pepper', 'Vegetables', 31, 1, 6, 0.3, [['1 medium', 119]]],
    ['tomato', 'Tomato', 'Vegetables', 18, 0.9, 3.9, 0.2, [['1 medium', 123]]],
    ['cucumber', 'Cucumber', 'Vegetables', 15, 0.7, 3.6, 0.1, [['1 cup sliced', 119]]],
    ['green-beans', 'Green beans, cooked', 'Vegetables', 35, 1.9, 7.9, 0.3, [['1 cup', 125]]],

    // Drinks
    ['coffee', 'Coffee, black', 'Drinks', 2, 0.3, 0, 0, [['1 mug', 240]]],
    ['orange-juice', 'Orange juice', 'Drinks', 45, 0.7, 10, 0.2, [['1 cup', 248]]],
    ['cola', 'Cola, regular', 'Drinks', 42, 0, 10.6, 0, [['1 can', 355]]],
    ['beer', 'Beer, regular', 'Drinks', 43, 0.5, 3.6, 0, [['1 can/bottle', 355]]],
    ['wine-red', 'Red wine', 'Drinks', 85, 0.1, 2.6, 0, [['1 glass', 150]]],

    // Snacks & meals
    ['dark-chocolate', 'Dark chocolate 70%', 'Snacks & meals', 598, 7.8, 46, 43, [['1 square', 10]]],
    ['honey', 'Honey', 'Snacks & meals', 304, 0.3, 82, 0, [['1 tbsp', 21]]],
    ['protein-bar', 'Protein bar (typical)', 'Snacks & meals', 350, 33, 38, 10, [['1 bar', 60]]],
    ['pizza-cheese', 'Pizza, cheese', 'Snacks & meals', 266, 11, 33, 10, [['1 slice', 107]]],
    ['cheeseburger', 'Cheeseburger (fast food)', 'Snacks & meals', 263, 13, 26, 12, [['1 burger', 120]]],
    ['fries', 'French fries', 'Snacks & meals', 312, 3.4, 41, 15, [['medium serving', 117]]],
    ['chips', 'Potato chips', 'Snacks & meals', 536, 7, 53, 35, [['1 oz bag', 28]]],
    ['popcorn', 'Popcorn, air-popped', 'Snacks & meals', 387, 13, 78, 4.5, [['3 cups', 24]]]
  ];

  var FOODS = RAW.map(function (r) {
    return {
      id: r[0], name: r[1], category: r[2],
      kcal: r[3], protein: r[4], carbs: r[5], fat: r[6],
      servings: r[7].map(function (s) { return { label: s[0], grams: s[1] }; })
    };
  });

  if (typeof module !== 'undefined' && module.exports) module.exports = FOODS;
  else root.FOODS = FOODS;
})(this);



/**
 * App state object.
 */
var State =
{
    pointsSpent: 0,
    specPointsSpent: 0,
    _selectedClass = Classes.Blade,
    skillTree: new SkillTree()
}
// State.pointsAvailable
Object.defineProperty(State, 'pointsAvailable',
{
    get: function()
    {
        return MAXPOINTS - State.pointsSpent;
    },
    enumerable: true
});
// State.specPointsAvailable
Object.defineProperty(State, 'specPointsAvailable',
{
    get: function()
    {
        return MAXSPECIALIZATION - State.specPointsSpent;
    },
    enumerable: true
});
// State.selectedClass
Object.defineProperty(State, 'selectedClass',
{
    get: function()
    {
        return State._selectedClass;
    },
    set: function(newClass)
    {
        State._selectedClass = newClass;
        State.skillTree.init(newClass);
        State.pointsSpent = 0;
    }
    enumerable: true
});

State.selectedClass = Classes.Tinker;

// State.skillTree.init(State.selectedClass);



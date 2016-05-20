
/**
 * Global constant MAXPOINTS
 */
Object.defineProperty(window, 'MAXPOINTS',
{
    value: 58,
    writable: false
});

/**
 * View state object.
 */
var State =
{
    pointsSpent: 0,
    
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

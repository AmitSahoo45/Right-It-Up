export function SignOut() {
    return (
        <form action="/auth/signout" method="post">
            <button
                type="submit"
                className="px-4 py-2 bg-objection-red/20 text-objection-red hover:bg-objection-red/30 rounded-xl text-sm font-medium transition-all border border-objection-red/30 hover:border-objection-red/50"
            >
                Logout
            </button>
        </form>
    )
}
export function SignOut() {
    return (
        <form action="/auth/signout" method="post" className="w-full md:w-auto">
            <button
                type="submit"
                className="w-full md:w-auto px-4 py-2 md:py-2 bg-objection-red/10 text-objection-red hover:bg-objection-red/20 rounded-xl text-sm font-medium transition-all border border-objection-red/20 hover:border-objection-red/40 cursor-pointer"
            >
                Logout
            </button>
        </form>
    )
}
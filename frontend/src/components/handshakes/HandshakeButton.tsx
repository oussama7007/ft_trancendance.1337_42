interface HandshakeProps
{
    listingId: number;
    clientId: number;
}


function HandshakeButton(props: HandshakeProps)
{
    function handleClick()
    {
        console.log("Listing:", props.listingId, "Client:", props.clientId);
        //next step will be linking this function to the the backend so i can store the data in the database using an api
    }
    return (
        <button
            onClick={handleClick}
            className="bg-transparent text-irent-orange font-bold px-6 py-2 rounded-md hover:bg-gray-100 transition-all duration-300"
        >
            Propose Handshake
        </button>
    );
}

export default HandshakeButton;
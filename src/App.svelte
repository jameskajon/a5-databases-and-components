<script>

	import { db, auth } from './firebase-config.js';

	export let forumData = getForums();

	function formatTimestamp(timestamp) {
		return (new Date(timestamp.seconds * 1000)).toUTCString()
	}

	export async function getForum(forumId) {
		let forumDoc = db.collection('forums').doc(forumId);
		let messageQuery = forumDoc.collection('messages').orderBy('date');
		let forumPromise = forumDoc.get()
				.then(snapshot => {
					return {
						forumTitle: snapshot.data().title,
						forumId: snapshot.id,
					};
				})
				.catch(err => {
					console.log('Error getting documents', err);
				});
		let messagesPromises = messageQuery.get()
				.then(snapshot => {
					return snapshot.docs.map(async function(doc) {
						return getUserDataUid(doc.data().poster)  // poster is the uid of the poster
								.then(userData => {
									return {
										messageId: doc.id,
										message: doc.data().message,
										... userData,
										date: formatTimestamp(doc.data().date),
									}
								});
					});
				})
				.catch(err => {
					console.log('Error getting documents', err);
				});

		return {
			... await forumPromise,
			messages: await Promise.all(await messagesPromises),
		};
	}

	export async function getForums() {
		let forumsQuery = db.collection('forums').orderBy('views', 'desc');
		let forumsPromises = forumsQuery.get()
				.then(snapshot => {
					return snapshot.docs.map(async function(doc) {
						return {
							forumId: doc.id,
							title: doc.data().title,
							stats: {
								views: doc.data().views,
								replies: doc.data().replies,
							},
							messageData: getMessageData(doc),
						}
					});
				})
				.catch(err => {
					console.log('Error getting documents', err);
				});

		// console.log("waiting for data to finish loading");
		let data = await Promise.all(await forumsPromises)
				.then(forums => {
					return forums.map(async function(forum) {
						return {
							forumId: forum.forumId,
							title: forum.title,
							shortDesc: (await forum.messageData.firstMessagePromise).shortDesc,
							stats: forum.stats,
							created: await (await forum.messageData.firstMessagePromise).created,
							lastPost: await (await forum.messageData.lastMessagePromise).lastPost,

						};
					});
				});
		return await Promise.all(data);
	}

	// returns two promises
	function getMessageData(forumDoc) {
		let firstMessageQuery = forumDoc.ref.collection('messages').orderBy('date').limit(1);
		let lastMessageQuery = forumDoc.ref.collection('messages').orderBy('date', "desc").limit(1);
		let firstMessagePromise = firstMessageQuery.get()
				.then(snapshot => {return snapshot.docs[0].data()})
				.then(async data => {
					return {
						shortDesc: data.message,
						created: getUserDataUid(data.poster)  // poster is the uid of the poster
								.then(userData => {
									return {
										... userData,
										date: formatTimestamp(data.date),
									}
								}),
					}
				})
				.catch(err => {
					console.log('Error getting documents', err);
				});
		let lastMessagePromise = lastMessageQuery.get()
				.then(snapshot => {return snapshot.docs[0].data()})
				.then(data => {
					return {
						lastPost: getUserDataUid(data.poster)  // poster is the uid of the poster
								.then(userData => {
									return {
										... userData,
										date: formatTimestamp(data.date),
									}
								}),
					}
				})
				.catch(err => {
					console.log('Error getting documents', err);
				});
		return {firstMessagePromise, lastMessagePromise}
	}

	// returns promise
	async function getUserDataUid(uid) {
		return await auth.getUser(uid)
				.then(function(userRecord) {
					// console.log('Successfully fetched user data:', userRecord.toJSON());
					return {
						uid: uid,
						name: userRecord.displayName,
						email: userRecord.email,
						memberSince: userRecord.metadata.creationTime,  // creation time is already a string in GMT
					}
				})
				.catch(function(error) {
					console.log('Error fetching user data:', error);
					return {
						uid: uid,
						name: '[deleted]',
						email: '[deleted]',
						memberSince: '[deleted]',
					};
				});
	}



</script>

<style>
	h1 {
		color: purple;
	}
</style>


<div class="row m-0">
	<div class="col p-0">
		<table class="table table-striped table-bordered table-responsive-sm table-add-row-table">
			<thead class="thead-light">
			<tr id="home-headers">
				<th scope="col" class="w-25">Topic</th>
				<th scope="col" class="created-col">Created</th>
				<th scope="col">Statistics</th>
				<th scope="col">Last post</th>
			</tr>
			</thead>
			<tbody>
			{#await forumData}
				<p>...waiting</p>
			{:then number}
				{#each forumData as entry}
					<tr>
						<td>
							<h3 class="h6"><a href="/forum/{ entry.forumId }">{ entry.title }</a></h3>
							<div class="small">{ entry.shortDesc }</div>
						</td>
						<td>
							<a title="{ entry.created.email }" data-uid="{ entry.message.uid }" href="/user/{ entry.created.uid }">{ entry.created.name }</a>
							<div>{ entry.created.date }</div>
						</td>
						<td>
							<div>{ entry.stats.replies } replies</div>
							<div>{ entry.stats.views } views</div>
						</td>
						<td>
							<a title="{ entry.lastPost.email }" data-uid="{ entry.message.uid }" href="/user/{ entry.created.uid }">{ entry.lastPost.name }</a>
							<div>{ entry.lastPost.date }</div>
						</td>
					</tr>
				{/each}
			{:catch error}
				<p style="color: red">{error.message}</p>
			{/await}
			<tr class="table-add-row">
				<td colspan="4">
					<button class="btn btn-info d-block" data-toggle="modal" data-target="#addThreadFormModal">Start a new Forum</button>
				</td>
			</tr>
			</tbody>
		</table>
	</div>
</div>

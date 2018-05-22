[AngularFire](../README.md) > [AssociatedReference](../interfaces/associatedreference.md)

# Interface: AssociatedReference

A structure that provides an association between a reference and a query on that reference. Note: Performing operations on the reference can lead to confusing results with complicated queries.

Example:

const query = ref.where('type', '==', 'Book'). .where('price', '>' 18.00) .where('price', '<' 100.00) .where('category', '==', 'Fiction') .where('publisher', '==', 'BigPublisher')

// This addition would not be a result of the query above ref.add({ type: 'Magazine', price: 4.99, category: 'Sports', publisher: 'SportsPublisher' });

## Hierarchy

**AssociatedReference**

## Index

### Properties

* [query](associatedreference.md#query)
* [ref](associatedreference.md#ref)

---

## Properties

<a id="query"></a>

###  query

**● query**: *[Query](../#query)*

*Defined in [firestore/interfaces.ts:83](https://github.com/angular/angularfire2/blob/a42a84f/src/firestore/interfaces.ts#L83)*

___
<a id="ref"></a>

###  ref

**● ref**: *[CollectionReference](../#collectionreference)*

*Defined in [firestore/interfaces.ts:82](https://github.com/angular/angularfire2/blob/a42a84f/src/firestore/interfaces.ts#L82)*

___

